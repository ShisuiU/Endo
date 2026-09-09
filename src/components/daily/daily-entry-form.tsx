"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CardLabel } from "@/components/ui/card";
import { ScoreSlider } from "@/components/ui/score-slider";
import { Toggle } from "@/components/ui/toggle";
import { TagInput } from "@/components/ui/tag-input";
import { DropletIcon, LeafIcon, MoonIcon, NoteIcon, SparkIcon } from "@/components/icons";
import { currentUserId, fetchEntry, upsertEntry } from "@/lib/entries-client";
import {
  claimDate,
  clearPending,
  readPending,
  releaseDate,
  writePending,
} from "@/lib/pending-entries";
import { dateParts } from "@/lib/date";
import type { DailyEntry, DailyEntryInput } from "@/lib/supabase/types";

type Draft = {
  had_crisis: boolean;
  crisis_intensity: number | null;
  pain_score: number | null;
  sleep_score: number | null;
  mood_score: number | null;
  energy_score: number | null;
  medication_taken: boolean;
  medication_notes: string;
  foods: string[];
  notes: string;
};

type Status = "loading" | "idle" | "saving" | "saved" | "error";

const EMPTY_DRAFT: Draft = {
  had_crisis: false,
  crisis_intensity: null,
  pain_score: null,
  sleep_score: null,
  mood_score: null,
  energy_score: null,
  medication_taken: false,
  medication_notes: "",
  foods: [],
  notes: "",
};

function draftFromEntry(entry: DailyEntry): Draft {
  return {
    had_crisis: entry.had_crisis,
    crisis_intensity: entry.crisis_intensity,
    pain_score: entry.pain_score,
    sleep_score: entry.sleep_score,
    mood_score: entry.mood_score,
    energy_score: entry.energy_score,
    medication_taken: entry.medication_taken,
    medication_notes: entry.medication_notes ?? "",
    foods: entry.foods,
    notes: entry.notes ?? "",
  };
}

function draftFromPayload(payload: DailyEntryInput): Draft {
  return {
    ...EMPTY_DRAFT,
    ...payload,
    medication_notes: payload.medication_notes ?? "",
    notes: payload.notes ?? "",
    foods: payload.foods ?? [],
  };
}

function toPayload(date: string, draft: Draft): DailyEntryInput {
  return {
    entry_date: date,
    ...draft,
    medication_notes: draft.medication_notes || null,
    notes: draft.notes || null,
  };
}

/** Empreinte du brouillon, pour ne rien envoyer qui n'a pas bougé. */
const fingerprint = (draft: Draft) => JSON.stringify(draft);

export function DailyEntryForm({ date }: { date: string }) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [status, setStatus] = useState<Status>("loading");
  const [retry, setRetry] = useState(0);
  const hydrated = useRef(false);
  const userId = useRef<string | null>(null);
  /** Dernier état connu du serveur : sert de témoin pour ne pas réécrire
   *  une journée qu'on vient juste de lire (sinon ouvrir un jour vide y
   *  créait une ligne, et le calendrier affichait des journées fantômes). */
  const saved = useRef("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { day, month, weekday } = dateParts(date);

  useEffect(() => {
    let cancelled = false;
    hydrated.current = false;
    setStatus("loading");
    claimDate(date);

    (async () => {
      const uid = await currentUserId();
      if (cancelled) return;
      userId.current = uid;

      let fromServer = EMPTY_DRAFT;
      let reachable = true;
      try {
        const entry = await fetchEntry(date);
        if (entry) fromServer = draftFromEntry(entry);
      } catch {
        // Hors-ligne : on n'écrase surtout pas ce qui attend en local.
        reachable = false;
      }
      if (cancelled) return;

      const pending = uid ? readPending(uid, date) : null;
      saved.current = reachable ? fingerprint(fromServer) : "";
      // Une journée mise de côté est forcément plus récente que ce que le
      // serveur renvoie : c'est la saisie qui n'a jamais pu partir.
      setDraft(pending ? draftFromPayload(pending.payload) : fromServer);
      hydrated.current = true;
      setStatus("idle");
    })();

    return () => {
      cancelled = true;
      releaseDate(date);
    };
  }, [date]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!hydrated.current) return;
    const snapshot = fingerprint(draft);
    if (snapshot === saved.current) return;

    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const payload = toPayload(date, draft);
      try {
        await upsertEntry(payload);
        saved.current = snapshot;
        if (userId.current) clearPending(userId.current, date);
        setStatus("saved");
      } catch {
        // L'échec est visible et la saisie survit au rechargement : c'est
        // tout l'objet de la file locale.
        if (userId.current) writePending(userId.current, date, payload);
        setStatus("error");
      }
    }, 700);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft, date, retry]);

  const retryNow = useCallback(() => setRetry((n) => n + 1), []);

  // Le retour du réseau relance l'envoi sans rien demander.
  useEffect(() => {
    window.addEventListener("online", retryNow);
    return () => window.removeEventListener("online", retryNow);
  }, [retryNow]);

  return (
    <div className="flex-1 flex flex-col px-6 pb-12">
      {/* Date en composition éditoriale : chiffres droits, mois en italique
          corail — la seule vraie « une » de l'app. */}
      <header className="pt-7 pb-6 hairline-b">
        <h1 className="font-display text-[3.9rem] leading-[1.02] tracking-[-0.03em]">
          <span className="tabular">{day}</span>{" "}
          <em className="italic text-accent">{month}</em>
        </h1>
        <div className="flex items-end justify-between mt-4">
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-muted">{weekday}</p>
          <SaveIndicator status={status} />
        </div>
      </header>

      <section className="py-7 hairline-b">
        <CardLabel>Crise</CardLabel>
        <Toggle
          label="Crise aujourd'hui"
          value={draft.had_crisis}
          onChange={(v) => update("had_crisis", v)}
          offLabel="Aucune"
          onLabel="Crise aujourd'hui"
        />
        {draft.had_crisis && (
          <div className="mt-7">
            <ScoreSlider
              label="Intensité"
              icon={<SparkIcon className="w-4 h-4 text-accent" />}
              value={draft.crisis_intensity}
              onChange={(v) => update("crisis_intensity", v)}
            />
          </div>
        )}
      </section>

      <section className="py-7 hairline-b flex flex-col gap-7">
        <CardLabel className="mb-0">Ressenti</CardLabel>
        <ScoreSlider
          label="Douleur"
          icon={<DropletIcon className="w-4 h-4" />}
          value={draft.pain_score}
          onChange={(v) => update("pain_score", v)}
        />
        <ScoreSlider
          label="Sommeil"
          icon={<MoonIcon className="w-4 h-4" />}
          value={draft.sleep_score}
          onChange={(v) => update("sleep_score", v)}
        />
        <ScoreSlider
          label="Humeur"
          value={draft.mood_score}
          onChange={(v) => update("mood_score", v)}
        />
        <ScoreSlider
          label="Énergie"
          value={draft.energy_score}
          onChange={(v) => update("energy_score", v)}
        />
      </section>

      <section className="py-7 hairline-b">
        <CardLabel>Médicament</CardLabel>
        <Toggle
          label="Médicament pris"
          value={draft.medication_taken}
          onChange={(v) => update("medication_taken", v)}
          offLabel="Non pris"
          onLabel="Pris"
        />
        {draft.medication_taken && (
          <label className="block mt-4">
            <span className="sr-only">Détail du médicament</span>
            <input
              value={draft.medication_notes}
              onChange={(e) => update("medication_notes", e.target.value)}
              placeholder="Lequel, à quelle heure…"
              className="w-full hairline rounded-2xl px-4 min-h-[52px] bg-surface outline-none focus:border-accent/60 text-[0.95rem]"
            />
          </label>
        )}
      </section>

      <section className="py-7 hairline-b">
        <CardLabel>
          <span className="inline-flex items-center gap-2">
            <LeafIcon className="w-3.5 h-3.5" /> Repas &amp; aliments
          </span>
        </CardLabel>
        <TagInput
          values={draft.foods}
          onChange={(v) => update("foods", v)}
          placeholder="Ajouter un aliment…"
        />
      </section>

      <section className="py-7">
        <CardLabel>
          <span className="inline-flex items-center gap-2">
            <NoteIcon className="w-3.5 h-3.5" /> Notes
          </span>
        </CardLabel>
        <label>
          <span className="sr-only">Notes libres</span>
          <textarea
            value={draft.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Ce qui vaut la peine d'être noté…"
            rows={4}
            className="w-full hairline rounded-2xl bg-surface p-4 outline-none focus:border-accent/60 text-[0.95rem] resize-none placeholder:text-muted/70"
          />
        </label>
      </section>

      {status === "error" ? (
        <UnsavedNotice onRetry={retryNow} />
      ) : (
        <p className="text-[0.75rem] text-muted">
          Tout est enregistré au fil de la saisie, rien à valider.
        </p>
      )}
    </div>
  );
}

function SaveIndicator({ status }: { status: Status }) {
  const label =
    status === "saving"
      ? "Enregistrement…"
      : status === "saved"
        ? "Enregistré"
        : status === "error"
          ? "Non enregistré"
          : "";
  return (
    <span
      aria-live="polite"
      className={`text-[0.75rem] min-h-[1em] ${status === "error" ? "text-accent" : "text-muted"}`}
    >
      {label}
    </span>
  );
}

/**
 * L'échec se dit, il ne se devine pas. Le message insiste sur ce qui compte
 * vraiment pour quelqu'un qui vient de noter sa journée : rien n'est perdu.
 */
function UnsavedNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="hairline rounded-2xl p-4 border-accent/40">
      <p className="text-[0.85rem] leading-relaxed">
        La connexion n&apos;a pas répondu.{" "}
        <span className="text-muted">
          Ta journée est gardée sur cet appareil et repartira toute seule dès le
          retour du réseau — tu peux fermer l&apos;app.
        </span>
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-[44px] px-5 rounded-full hairline text-[0.85rem] text-accent hover:bg-surface"
      >
        Réessayer maintenant
      </button>
    </div>
  );
}
