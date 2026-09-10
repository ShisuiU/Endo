"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CardLabel } from "@/components/ui/card";
import { DayCall } from "@/components/daily/day-call";
import { DayWizard, type WizardStep } from "@/components/daily/day-wizard";
import { DaySummary, type DaySummaryData } from "@/components/daily/day-summary";
import {
  currentUserId,
  deleteEntry,
  fetchEntry,
  fetchHabits,
  upsertEntry,
  type Habits,
} from "@/lib/entries-client";
import {
  claimDate,
  clearPending,
  readPending,
  releaseDate,
  writePending,
} from "@/lib/pending-entries";
import { TrashIcon } from "@/components/icons";
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

const SCORES = [
  { key: "pain_score", label: "Douleur" },
  { key: "sleep_score", label: "Sommeil" },
  { key: "mood_score", label: "Humeur" },
  { key: "energy_score", label: "Énergie" },
] as const;

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

/** La journée a-t-elle été touchée ? Sert à choisir le libellé du bouton. */
const isBlank = (draft: Draft) => fingerprint(draft) === fingerprint(EMPTY_DRAFT);

export function DailyEntryForm({
  date,
  onDeleted,
}: {
  date: string;
  /** Fourni par l'écran d'une journée passée : l'accueil, lui, ne se
   *  supprime pas — on y revient tous les jours. */
  onDeleted?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [status, setStatus] = useState<Status>("loading");
  const [retry, setRetry] = useState(0);
  /** Index de la question ouverte dans le parcours, `null` s'il est fermé. */
  const [wizardAt, setWizardAt] = useState<number | null>(null);
  /** Ce qui revient souvent dans ce carnet : aliments les plus notés,
   *  dernier médicament écrit. Chargé à part du brouillon — c'est un
   *  confort, il ne doit jamais retarder la saisie ni la faire échouer. */
  const [habits, setHabits] = useState<Habits>({ foods: [], medication: null });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    fetchHabits()
      .then((found) => !cancelled && setHabits(found))
      .catch(() => {
        // Hors-ligne, ou rien à proposer : le champ reste simplement nu.
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const closeWizard = useCallback(() => setWizardAt(null), []);

  // Répondre « aucune crise » efface l'intensité : sans ça, une intensité
  // saisie puis annulée restait en base, invisible à l'écran mais bien
  // présente dans les données.
  const setCrisis = useCallback((value: boolean) => {
    setDraft((prev) => ({
      ...prev,
      had_crisis: value,
      crisis_intensity: value ? prev.crisis_intensity : null,
    }));
  }, []);

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

  // Le parcours entier : les questions sans objet (intensité sans crise)
  // disparaissent d'elles-mêmes, et la numérotation suit.
  const steps: WizardStep[] = [
    {
      id: "crisis",
      kind: "toggle",
      title: "Crise",
      hint: "Une crise aujourd'hui, même courte ?",
      value: draft.had_crisis,
      offLabel: "Aucune",
      onLabel: "Oui",
      onChange: setCrisis,
    },
    ...(draft.had_crisis
      ? [
          {
            id: "intensity",
            kind: "score" as const,
            title: "Intensité",
            hint: "À quel point la crise a été forte.",
            value: draft.crisis_intensity,
            onChange: (v: number) => update("crisis_intensity", v),
          },
        ]
      : []),
    {
      id: "pain",
      kind: "score",
      title: "Douleur",
      hint: "0 : rien. 10 : la pire que tu connaisses.",
      value: draft.pain_score,
      onChange: (v) => update("pain_score", v),
    },
    {
      id: "sleep",
      kind: "score",
      title: "Sommeil",
      hint: "La nuit qui vient de passer, pas la fatigue du jour.",
      value: draft.sleep_score,
      onChange: (v) => update("sleep_score", v),
    },
    {
      id: "mood",
      kind: "score",
      title: "Humeur",
      hint: "Le moral, indépendamment de la douleur.",
      value: draft.mood_score,
      onChange: (v) => update("mood_score", v),
    },
    {
      id: "energy",
      kind: "score",
      title: "Énergie",
      hint: "Ce que tu as pu faire aujourd'hui.",
      value: draft.energy_score,
      onChange: (v) => update("energy_score", v),
    },
    {
      id: "medication",
      kind: "toggle",
      title: "Médicament",
      hint: "Un médicament pris pour la douleur ?",
      value: draft.medication_taken,
      offLabel: "Non pris",
      onLabel: "Pris",
      onChange: (v) => update("medication_taken", v),
      detail: {
        value: draft.medication_notes,
        placeholder: "Lequel, à quelle heure…",
        onChange: (v) => update("medication_notes", v),
        habit: habits.medication,
      },
    },
    {
      id: "foods",
      kind: "tags",
      title: "Repas",
      hint: "Ce que tu as mangé, si tu veux pouvoir le relier à tes crises.",
      values: draft.foods,
      placeholder: "Ajouter un aliment…",
      onChange: (v) => update("foods", v),
      habits: habits.foods,
    },
    {
      id: "notes",
      kind: "text",
      title: "Notes",
      hint: "Ce qui vaut la peine d'être noté et qui n'entre dans aucune case.",
      value: draft.notes,
      placeholder: "Ce que tu veux retenir de cette journée…",
      onChange: (v) => update("notes", v),
    },
  ];

  const at = (id: string) => steps.findIndex((s) => s.id === id);
  // On reprend là où il reste à répondre, pas systématiquement au début.
  const firstUnanswered = Math.max(
    steps.findIndex((s) => s.kind === "score" && s.value === null),
    0
  );

  // Le résumé reprend l'ordre du parcours : on relit comme on a répondu.
  const summary: DaySummaryData = {
    crisis: { step: at("crisis"), had: draft.had_crisis, intensity: draft.crisis_intensity },
    scores: SCORES.map(({ key, label }) => ({
      step: at(key === "pain_score" ? "pain" : key === "sleep_score" ? "sleep" : key === "mood_score" ? "mood" : "energy"),
      key,
      label,
      value: draft[key],
    })),
    medication: {
      step: at("medication"),
      taken: draft.medication_taken,
      detail: draft.medication_notes,
    },
    foods: { step: at("foods"), list: draft.foods },
    notes: { step: at("notes"), text: draft.notes },
  };

  // « Compléter » tant qu'une note manque, « Revoir » quand tout est répondu.
  const missing = steps.filter((s) => s.kind === "score" && s.value === null).length;
  const complete = missing === 0;

  const blank = isBlank(draft);

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

      <DayCall
        headline={
          blank
            ? "Comment s'est passée ta journée ?"
            : complete
              ? "Journée notée."
              : "Il reste des questions."
        }
        detail={
          blank
            ? "Crise, douleur, sommeil, humeur, énergie, médicament, repas — une question à la fois, rien d'obligatoire."
            : complete
              ? "Tout est noté. Tu peux revenir dessus quand tu veux."
              : `${missing} ${missing > 1 ? "notes n'ont" : "note n'a"} pas encore été donnée${missing > 1 ? "s" : ""}.`
        }
        action={blank ? "Évaluer la journée" : complete ? "Revoir la journée" : "Compléter la journée"}
        glow={!complete}
        onStart={() => setWizardAt(blank ? 0 : firstUnanswered)}
      />

      {!blank && (
        <section className="pb-8">
          <CardLabel>Résumé du jour</CardLabel>
          <DaySummary data={summary} onOpen={setWizardAt} />
        </section>
      )}

      {wizardAt !== null && (
        <DayWizard steps={steps} startAt={wizardAt} onClose={closeWizard} />
      )}

      {onDeleted && !blank && (
        <section className="pb-8">
          {confirmDelete ? (
            <div role="alert" className="hairline rounded-2xl border-accent/40 p-4">
              <p className="text-[0.85rem] leading-relaxed">
                Cette journée sera effacée, sans retour possible.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      if (userId.current) clearPending(userId.current, date);
                      await deleteEntry(date);
                      onDeleted();
                    } catch {
                      setDeleting(false);
                      setConfirmDelete(false);
                      setStatus("error");
                    }
                  }}
                  className="min-h-[44px] rounded-full bg-accent px-5 text-[0.85rem] font-medium text-ground disabled:opacity-50"
                >
                  {deleting ? "Suppression…" : "Oui, supprimer"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[44px] rounded-full px-5 text-[0.85rem] text-muted hover:text-foreground"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-[0.85rem] text-muted transition-colors hover:text-foreground"
            >
              <TrashIcon className="h-4 w-4" /> Supprimer cette journée
            </button>
          )}
        </section>
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
