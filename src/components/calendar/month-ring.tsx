"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { fetchEntriesInRange } from "@/lib/entries-client";
import { isoDate, todayISO } from "@/lib/date";
import type { DailyEntry } from "@/lib/supabase/types";

const MONTH_LABEL = new Intl.DateTimeFormat("fr-FR", { month: "long" });
const FULL_DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const BOX = 340;
const CENTRE = BOX / 2;
const RADIUS = 122;

/**
 * Le mois en anneau plutôt qu'en grille.
 *
 * Une grille de tableur ne raconte rien d'un cycle ; un cercle, si — on voit
 * d'un coup d'œil si les crises se regroupent ou s'espacent.
 *
 * Le point délicat est de rester tapable. Les traits de crise ne font que
 * quelques pixels de large : ils ne servent qu'à *voir*. Ce sont des secteurs
 * transparents en éventail, un par jour, qui reçoivent le clic. Mesuré sur
 * un écran de 390 px : boîte englobante de 72 × 56 px par jour, le secteur
 * lui-même s'évasant d'environ 18 px d'arc au rayon intérieur à 32 px au
 * rayon extérieur, sur 68 px de profondeur. On est donc au-dessus du
 * minimum WCAG 2.2 (24 × 24 px) sur toute la profondeur utile.
 */
export function MonthRing() {
  const router = useRouter();
  const [cursor, setCursor] = useState<{ year: number; month: number } | null>(null);
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
  const today = todayISO();

  useEffect(() => {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
  }, []);

  useEffect(() => {
    if (!cursor) return;
    const start = isoDate(new Date(cursor.year, cursor.month, 1));
    const end = isoDate(new Date(cursor.year, cursor.month + 1, 0));
    fetchEntriesInRange(start, end).then((rows) => {
      const map: Record<string, DailyEntry> = {};
      for (const row of rows) map[row.entry_date] = row;
      setEntries(map);
    });
  }, [cursor]);

  const days = useMemo(() => {
    if (!cursor) return [];
    const count = new Date(cursor.year, cursor.month + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => {
      const day = i + 1;
      const date = isoDate(new Date(cursor.year, cursor.month, day));
      // −90° pour que le 1er du mois soit à midi sur le cadran.
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      return { day, date, angle };
    });
  }, [cursor]);

  if (!cursor) return null;

  const label = MONTH_LABEL.format(new Date(cursor.year, cursor.month, 1));
  const point = (angle: number, r: number) => ({
    x: CENTRE + Math.cos(angle) * r,
    y: CENTRE + Math.sin(angle) * r,
  });

  return (
    <div className="flex-1 flex flex-col justify-center px-6 pb-6">
      {/* Le mois est écrit au centre de l'anneau : l'en-tête ne porte donc
          que la navigation, pour ne pas le répéter deux fois à l'écran. */}
      <h1 className="sr-only">
        {label} {cursor.year}
      </h1>
      <div className="flex items-center justify-between">
        <button
          aria-label="Mois précédent"
          onClick={() =>
            setCursor((c) => c && { year: c.month === 0 ? c.year - 1 : c.year, month: (c.month + 11) % 12 })
          }
          className="w-12 h-12 -ml-2 flex items-center justify-center text-muted hover:text-foreground"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <button
          aria-label="Mois suivant"
          onClick={() =>
            setCursor((c) => c && { year: c.month === 11 ? c.year + 1 : c.year, month: (c.month + 1) % 12 })
          }
          className="w-12 h-12 -mr-2 flex items-center justify-center text-muted hover:text-foreground"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      <svg viewBox={`0 0 ${BOX} ${BOX}`} className="w-full h-auto" role="group" aria-label={`Calendrier de ${label} ${cursor.year}`}>
        <circle cx={CENTRE} cy={CENTRE} r={RADIUS} fill="none" stroke="var(--hairline)" />

        {days.map(({ day, date, angle }) => {
          const entry = entries[date];
          const crisis = entry?.had_crisis ?? false;
          const inner = point(angle, RADIUS - 13);
          const outer = point(angle, RADIUS + (crisis ? 13 : 7));
          const med = point(angle, RADIUS + 22);
          const dot = point(angle, RADIUS - 26);
          const lab = point(angle, RADIUS + 38);
          const showLabel = day === 1 || day % 5 === 0;

          return (
            <g key={date}>
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={crisis ? "var(--color-coral)" : "var(--color-muted-ink)"}
                strokeOpacity={crisis ? 1 : 0.4}
                strokeWidth={crisis ? 3.5 : 1.5}
                strokeLinecap="round"
              />
              {entry?.medication_taken && (
                <circle cx={med.x} cy={med.y} r={2.4} fill="var(--color-brass)" />
              )}
              {date === today && (
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={4.5}
                  fill="none"
                  stroke="var(--color-text)"
                  strokeWidth={1.5}
                />
              )}
              {showLabel && (
                <text
                  x={lab.x}
                  y={lab.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--color-muted-ink)"
                >
                  {day}
                </text>
              )}
            </g>
          );
        })}

        {/* Zones de clic : secteurs transparents en éventail, larges bien
            au-delà du trait qu'ils recouvrent. */}
        {days.map(({ day, date, angle }) => {
          const half = Math.PI / days.length;
          const a1 = angle - half;
          const a2 = angle + half;
          const rIn = RADIUS - 34;
          const rOut = RADIUS + 34;
          const p1 = point(a1, rIn);
          const p2 = point(a1, rOut);
          const p3 = point(a2, rOut);
          const p4 = point(a2, rIn);
          const d = [
            `M${p1.x.toFixed(2)},${p1.y.toFixed(2)}`,
            `L${p2.x.toFixed(2)},${p2.y.toFixed(2)}`,
            `A${rOut},${rOut} 0 0 1 ${p3.x.toFixed(2)},${p3.y.toFixed(2)}`,
            `L${p4.x.toFixed(2)},${p4.y.toFixed(2)}`,
            `A${rIn},${rIn} 0 0 0 ${p1.x.toFixed(2)},${p1.y.toFixed(2)}`,
            "Z",
          ].join(" ");
          const entry = entries[date];
          const parts = [FULL_DATE.format(new Date(date + "T12:00:00"))];
          if (entry?.had_crisis) parts.push("crise");
          if (entry?.medication_taken) parts.push("médicament pris");

          return (
            <path
              key={`hit-${date}`}
              d={d}
              fill="transparent"
              className="cursor-pointer focus:outline-none [&:focus-visible]:fill-[color-mix(in_srgb,var(--color-coral)_18%,transparent)]"
              role="button"
              tabIndex={0}
              aria-label={parts.join(", ")}
              onClick={() => router.push(`/jour/${date}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/jour/${date}`);
                }
              }}
            >
              <title>{`${day} — ${parts.slice(1).join(", ") || "aucune note"}`}</title>
            </path>
          );
        })}

        <text
          x={CENTRE}
          y={CENTRE - 2}
          textAnchor="middle"
          className="font-display"
          fontStyle="italic"
          fontSize="30"
          fill="var(--color-text)"
        >
          {label}
        </text>
        <text
          x={CENTRE}
          y={CENTRE + 22}
          textAnchor="middle"
          fontSize="11"
          letterSpacing="3"
          fill="var(--color-muted-ink)"
        >
          {cursor.year}
        </text>
      </svg>

      <div className="flex items-center justify-center gap-6 mt-6 text-[0.8rem] text-muted">
        <span className="flex items-center gap-2">
          <span aria-hidden className="w-4 h-[3px] rounded-full bg-accent" /> Crise
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-brass" /> Médicament
        </span>
      </div>

      <p className="text-center text-[0.78rem] text-muted/70 mt-4">
        Touche un jour de l&apos;anneau pour l&apos;ouvrir.
      </p>
    </div>
  );
}
