"use client";

import { useEffect, useRef, useState } from "react";
import { CardLabel } from "@/components/ui/card";
import { ScoreSlider } from "@/components/ui/score-slider";
import { Toggle } from "@/components/ui/toggle";
import { TagInput } from "@/components/ui/tag-input";
import {
  DropletIcon,
  LeafIcon,
  MoonIcon,
  NoteIcon,
  PillIcon,
  SparkIcon,
} from "@/components/icons";
import { fetchEntry, upsertEntry } from "@/lib/entries-client";
import { friendlyDate } from "@/lib/date";
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
      const payload: DailyEntryInput = { entry_date: date, ...draft, medication_notes: draft.medication_notes || null, notes: draft.notes || null };
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
    <div className="flex-1 flex flex-col px-5 pb-10">
      <div className="flex items-baseline justify-between pt-6 pb-5">
        <h1 className="font-display italic text-2xl text-foreground">{friendlyDate(date)}</h1>
        <SaveIndicator status={status} />
      </div>

      <section className="hairline rounded-2xl bg-surface p-5 mb-4">
        <CardLabel>Crise</CardLabel>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparkIcon className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium">Crise aujourd&apos;hui</span>
          </div>
          <Toggle value={draft.had_crisis} onChange={(v) => update("had_crisis", v)} />
        </div>
        {draft.had_crisis && (
          <div className="mt-5">
            <ScoreSlider
              label="Intensité"
              value={draft.crisis_intensity}
              onChange={(v) => update("crisis_intensity", v)}
            />
          </div>
        )}
      </section>

      <section className="hairline rounded-2xl bg-surface p-5 mb-4 flex flex-col gap-6">
        <CardLabel className="mb-0">Ressenti du jour</CardLabel>
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

      <section className="hairline rounded-2xl bg-surface p-5 mb-4">
        <CardLabel>Médicament</CardLabel>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PillIcon className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium">Pris aujourd&apos;hui</span>
          </div>
          <Toggle value={draft.medication_taken} onChange={(v) => update("medication_taken", v)} />
        </div>
        {draft.medication_taken && (
          <input
            value={draft.medication_notes}
            onChange={(e) => update("medication_notes", e.target.value)}
            placeholder="Lequel, à quelle heure…"
            className="mt-4 w-full hairline rounded-xl px-3.5 py-2.5 bg-background outline-none focus:border-accent/60 text-sm"
          />
        )}
      </section>

      <section className="hairline rounded-2xl bg-surface p-5 mb-4">
        <CardLabel>
          <span className="inline-flex items-center gap-1.5">
            <LeafIcon className="w-3.5 h-3.5" /> Repas &amp; aliments
          </span>
        </CardLabel>
        <TagInput
          values={draft.foods}
          onChange={(v) => update("foods", v)}
          placeholder="Ajouter un aliment…"
        />
      </section>

      <section className="hairline rounded-2xl bg-surface p-5">
        <CardLabel>
          <span className="inline-flex items-center gap-1.5">
            <NoteIcon className="w-3.5 h-3.5" /> Notes
          </span>
        </CardLabel>
        <textarea
          value={draft.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Ce qui vaut la peine d'être noté…"
          rows={3}
          className="w-full bg-transparent outline-none text-sm resize-none placeholder:text-muted/70"
        />
      </section>
    </div>
  );
}

function SaveIndicator({ status }: { status: "loading" | "idle" | "saving" | "saved" }) {
  if (status === "loading") return null;
  const label = status === "saving" ? "Enregistrement…" : status === "saved" ? "Enregistré" : "";
  if (!label) return <span className="h-[1em]" />;
  return <span className="text-xs text-muted tabular">{label}</span>;
}
