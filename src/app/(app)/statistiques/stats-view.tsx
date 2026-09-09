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

    const range: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      range.push(isoDate(d));
    }
    setDates(range);

    fetchAllCrisisDates().then((crisisDates) => setStats(computeCrisisStats(crisisDates)));
    fetchEntriesInRange(isoDate(start), isoDate(end)).then(setEntries);
  }, []);

  const byDate = new Map(entries.map((e) => [e.entry_date, e]));
  const painValues = dates.map((d) => byDate.get(d)?.pain_score ?? null);
  const sleepValues = dates.map((d) => byDate.get(d)?.sleep_score ?? null);
  const moodValues = dates.map((d) => byDate.get(d)?.mood_score ?? null);
  const medicatedDays = entries.filter((e) => e.medication_taken).length;

  return (
    <div className="px-6 pt-7 pb-12">
      {/* Le chiffre qui compte, traité comme une une de magazine. */}
      <section className="pb-7 hairline-b">
        <CardLabel>Entre deux crises</CardLabel>
        {stats === null ? (
          <p className="text-[0.95rem] text-muted">Chargement…</p>
        ) : stats.count < 2 ? (
          <p className="text-[0.95rem] text-muted leading-relaxed max-w-[34ch]">
            Encore trop peu de crises enregistrées pour estimer un intervalle.
            Continue à renseigner tes journées.
          </p>
        ) : (
          <>
            <p className="font-display leading-[0.85] tracking-[-0.04em]">
              <span className="text-[5.5rem] text-accent tabular">{stats.averageInterval}</span>
              <span className="font-display italic text-[1.5rem] text-foreground ml-3">jours</span>
            </p>
            <p className="text-[0.9rem] text-muted mt-4 leading-relaxed max-w-[34ch]">
              C&apos;est ta moyenne sur {stats.count} crises enregistrées.
              {/* La moyenne seule ment quand l'écart est large : 6 et 29 jours
                  donnent « 14 », un intervalle qui n'est jamais arrivé. */}
              {stats.minInterval !== null && stats.maxInterval !== null &&
                stats.minInterval !== stats.maxInterval && (
                  <>
                    {" "}
                    Dans les faits, elles se sont espacées de{" "}
                    <span className="text-foreground tabular">{stats.minInterval}</span> à{" "}
                    <span className="text-foreground tabular">{stats.maxInterval}</span> jours.
                  </>
                )}
            </p>
            {stats.estimateLabel && (
              <p className="mt-4 inline-block hairline rounded-full px-4 py-2.5 text-[0.85rem]">
                {stats.estimateLabel}
              </p>
            )}

            {/* Ces deux chiffres étaient posés dans deux vignettes côte à
                côte — le motif de tableau de bord qu'on trouve partout, et
                que ce projet s'interdit. Ils sont écrits, avec les nombres
                composés comme les dates et les scores : en Bodoni, dans la
                phrase. */}
            {stats.averageLength !== null && (
              <p className="mt-9 text-[0.95rem] leading-[2.4] text-muted">
                Une crise dure <Nombre>{stats.averageLength}</Nombre> jour
                {stats.averageLength > 1 ? "s" : ""} en moyenne.
                <br />
                Médicament pris <Nombre>{medicatedDays}</Nombre> jour
                {medicatedDays > 1 ? "s" : ""} sur les {WINDOW_DAYS} derniers.
              </p>
            )}
          </>
        )}
      </section>

      <section className="pt-7 flex flex-col gap-7">
        <CardLabel className="mb-0">Les {WINDOW_DAYS} derniers jours</CardLabel>
        <TrendLine label="Douleur" values={painValues} />
        <TrendLine label="Sommeil" values={sleepValues} tone="sage" />
        <TrendLine label="Humeur" values={moodValues} tone="sage" />
        {dates.length > 0 && (
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted/70">
            {friendlyDate(dates[0])} → {friendlyDate(dates[dates.length - 1])}
          </p>
        )}
      </section>
    </div>
  );
}

/**
 * Un nombre dans le fil du texte, composé comme les dates et les scores.
 *
 * En couleur de texte, pas en corail : l'accent est déjà pris par
 * l'intervalle entre crises, juste au-dessus. Trois nombres coraux dans la
 * même section et plus aucun ne ressort — c'est la taille et la police qui
 * font la hiérarchie ici, pas la couleur.
 */
function Nombre({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display italic text-[1.6rem] leading-none text-foreground tabular">
      {children}
    </span>
  );
}
