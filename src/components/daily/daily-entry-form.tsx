"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CardLabel } from "@/components/ui/card";
import { ScoreSlider } from "@/components/ui/score-slider";
import { ScoreWizard, type ScoreStep } from "@/components/daily/score-wizard";
import { Toggle } from "@/components/ui/toggle";
import { TagInput } from "@/components/ui/tag-input";
import { ChevronRightIcon, LeafIcon, NoteIcon, SparkIcon } from "@/components/icons";
import { currentUserId, fetchEntry, upsertEntry } from "@/lib/entries-client";
import {
  claimDate,
  clearPending,
  readPending,
  releaseDate,
  writePending,
} from "@/lib/pending-entries";
import { dateParts } from "@/lib/date";
import { cn } from "@/lib/cn";
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

/**
 * Les quatre notes de la journée, dans l'ordre où on les demande : ce qui
 * fait mal d'abord, ce qui répare ensuite.
 */
const SCORES = [
  { key: "pain_score", label: "Douleur", hint: "0 : rien. 10 : la pire que tu connaisses." },
  { key: "sleep_score", label: "Sommeil", hint: "La nuit qui vient de passer, pas la fatigue du jour." },
  { key: "mood_score", label: "Humeur", hint: "Le moral, indépendamment de la douleur." },
  { key: "energy_score", label: "Énergie", hint: "Ce que tu as pu faire aujourd'hui." },
] as const satisfies readonly { key: keyof Draft; label: string; hint: string }[];

/** Empreinte du brouillon, pour ne rien envoyer qui n'a pas bougé. */
const fingerprint = (draft: Draft) => JSON.stringify(draft);

export function DailyEntryForm({ date }: { date: string }) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [status, setStatus] = useState<Status>("loading");
  const [retry, setRetry] = useState(0);
  /** Index de la question ouverte dans l'assistant, `null` s'il est fermé. */
  const [wizardAt, setWizardAt] = useState<number | null>(null);
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

  const update = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Stables : le dialogue d'évaluation les prend en dépendance d'effet.
  const closeWizard = useCallback(() => setWizardAt(null), []);
  const setScore = useCallback(
    (key: string, value: number) => update(key as keyof Draft, value as Draft[keyof Draft]),
    [update]
  );

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

  const answered = SCORES.filter(({ key }) => draft[key] !== null).length;
  // On rouvre là où il reste à répondre, pas systématiquement au début.
  const firstUnanswered = Math.max(
    SCORES.findIndex(({ key }) => draft[key] === null),
    0
  );

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

      {/* Les quatre notes ne sont plus empilées ici : elles se remplissent une
          par écran (voir `ScoreWizard`). Ce bloc ne garde que ce qu'on veut
          voir d'un coup d'œil — ce qui est déjà noté — et sert de porte
          d'entrée. */}
      <section className="py-7 hairline-b">
        <CardLabel>Ressenti</CardLabel>
        <button
          type="button"
          onClick={() => setWizardAt(firstUnanswered)}
          className="w-full hairline rounded-2xl bg-surface px-5 py-4 min-h-[56px] flex items-center gap-4 text-left transition-colors hover:bg-surface-2"
        >
          {answered === 0 ? (
            <span className="flex-1">
              <span className="block text-[0.95rem]">Évaluer la journée</span>
              <span className="mt-1 block text-[0.78rem] text-muted">
                Douleur, sommeil, humeur, énergie — une question à la fois.
              </span>
            </span>
          ) : (
            <span className="flex-1 grid grid-cols-4 gap-2">
              {SCORES.map(({ key, label }) => (
                <span key={key} className="block">
                  <span className="block text-[0.6rem] uppercase tracking-[0.14em] text-muted">
                    {label}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block font-display italic text-[1.5rem] leading-none tabular",
                      draft[key] === null ? "text-muted/45" : "text-accent"
                    )}
                  >
                    {draft[key] ?? "–"}
                  </span>
                </span>
              ))}
            </span>
          )}
          <ChevronRightIcon className="w-5 h-5 shrink-0 text-muted" aria-hidden />
        </button>
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

      {wizardAt !== null && (
        <ScoreWizard
          steps={SCORES.map(({ key, label, hint }): ScoreStep => ({
            key,
            label,
            hint,
            value: draft[key] as number | null,
          }))}
          startAt={wizardAt}
          onChange={setScore}
          onClose={closeWizard}
        />
      )}

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
