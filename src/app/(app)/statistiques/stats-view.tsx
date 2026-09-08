"use client";

import { useEffect, useState } from "react";
import { CardLabel } from "@/components/ui/card";
import { TrendLine } from "@/components/stats/trend-line";
import { fetchAllCrisisDates, fetchEntriesInRange } from "@/lib/entries-client";
import { computeCrisisStats, type CrisisStats } from "@/lib/stats";
import { isoDate, friendlyDate } from "@/lib/date";
import type { DailyEntry } from "@/lib/supabase/types";

const WINDOW_DAYS = 21;

export function StatsView() {
  const [stats, setStats] = useState<CrisisStats | null>(null);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (WINDOW_DAYS - 1));
    const startISO = isoDate(start);
    const endISO = isoDate(end);

    const range: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      range.push(isoDate(d));
    }
    setDates(range);

    fetchAllCrisisDates().then((crisisDates) => setStats(computeCrisisStats(crisisDates)));
    fetchEntriesInRange(startISO, endISO).then(setEntries);
  }, []);

  const byDate = new Map(entries.map((e) => [e.entry_date, e]));
  const painValues = dates.map((d) => byDate.get(d)?.pain_score ?? null);
  const sleepValues = dates.map((d) => byDate.get(d)?.sleep_score ?? null);
  const moodValues = dates.map((d) => byDate.get(d)?.mood_score ?? null);

  return (
    <div className="px-5 pt-6 pb-10 flex flex-col gap-4">
      <h1 className="font-display italic text-2xl mb-1">Repères</h1>

      <section className="hairline rounded-2xl bg-surface p-5">
        <CardLabel>Entre deux crises</CardLabel>
        {stats === null ? (
          <p className="text-sm text-muted">Chargement…</p>
        ) : stats.count < 2 ? (
          <p className="text-sm text-muted leading-relaxed">
            Encore trop peu de crises enregistrées pour estimer un intervalle. Continue à
            renseigner tes journées.
          </p>
        ) : (
          <div className="flex items-end justify-between">
            <div>
              <p className="font-display italic text-4xl text-ink tabular">
                {stats.averageInterval}
                <span className="text-base text-muted not-italic font-sans ml-1.5">jours</span>
              </p>
              <p className="text-xs text-muted mt-1">en moyenne, sur {stats.count} crises</p>
            </div>
            {stats.estimateLabel && (
              <p className="text-sm text-ink-soft text-right max-w-[13ch] leading-snug">
                {stats.estimateLabel}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="hairline rounded-2xl bg-surface p-5 flex flex-col gap-6">
        <CardLabel className="mb-0">Les {WINDOW_DAYS} derniers jours</CardLabel>
        <TrendLine label="Douleur" values={painValues} />
        <TrendLine label="Sommeil" values={sleepValues} />
        <TrendLine label="Humeur" values={moodValues} />
        <p className="text-[0.7rem] text-muted/80">
          {friendlyDate(dates[0])} → {friendlyDate(dates[dates.length - 1] ?? dates[0])}
        </p>
      </section>
    </div>
  );
}
