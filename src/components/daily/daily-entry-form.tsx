"use client";

import { useEffect, useRef, useState } from "react";
import { CardLabel } from "@/components/ui/card";
import { ScoreSlider } from "@/components/ui/score-slider";
import { Toggle } from "@/components/ui/toggle";
import { TagInput } from "@/components/ui/tag-input";
import { DropletIcon, LeafIcon, MoonIcon, NoteIcon, SparkIcon } from "@/components/icons";
import { fetchEntry, upsertEntry } from "@/lib/entries-client";
import { dateParts } from "@/lib/date";
import type { DailyEntryInput } from "@/lib/supabase/types";

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

export function DailyEntryForm({ date }: { date: string }) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "saved">("loading");
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { day, month, weekday } = dateParts(date);

  useEffect(() => {
    hydrated.current = false;
    setStatus("loading");
    fetchEntry(date).then((entry) => {
      setDraft(
        entry
          ? {
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
            }
          : EMPTY_DRAFT
      );
      hydrated.current = true;
      setStatus("idle");
    });
  }, [date]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!hydrated.current) return;
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const payload: DailyEntryInput = {
        entry_date: date,
        ...draft,
        medication_notes: draft.medication_notes || null,
        notes: draft.notes || null,
      };
      try {
        await upsertEntry(payload);
        setStatus("saved");
      } catch {
        setStatus("idle");
      }
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft, date]);

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

      <p className="text-[0.75rem] text-muted">
        Tout est enregistré au fil de la saisie, rien à valider.
      </p>
    </div>
  );
}

function SaveIndicator({ status }: { status: "loading" | "idle" | "saving" | "saved" }) {
  const label = status === "saving" ? "Enregistrement…" : status === "saved" ? "Enregistré" : "";
  return (
    <span aria-live="polite" className="text-[0.75rem] text-muted min-h-[1em]">
      {label}
    </span>
  );
}
