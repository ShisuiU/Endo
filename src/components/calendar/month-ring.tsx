"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Nombre } from "@/components/ui/inline-number";
import { fetchEntriesInRange } from "@/lib/entries-client";
import { isoDate, todayISO } from "@/lib/date";
import { cn } from "@/lib/cn";
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
 *
 * Sur grand écran (`lg`), l'anneau passe à gauche et tout ce qui était
 * empilé dessous — légende, invitation, et le récit du mois — vient se
 * ranger à côté. Ce n'est pas seulement une question de largeur : sur un
 * portable la fenêtre est **basse**, et l'empilement mobile touchait le bas
 * de l'écran. Les mêmes éléments, reflowés — aucun n'est monté deux fois.
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

  const rows = Object.values(entries);
  const month = {
    days: days.length,
    logged: rows.length,
    crisis: rows.filter((e) => e.had_crisis).length,
    medicated: rows.filter((e) => e.medication_taken).length,
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 pb-6 lg:flex-row lg:items-center lg:gap-14">
      {/* Le mois est écrit au centre de l'anneau : l'en-tête ne porte donc
          que la navigation, pour ne pas le répéter deux fois à l'écran. */}
      <h1 className="sr-only">
        {label} {cursor.year}
      </h1>

      <div className="lg:min-w-0 lg:flex-1">
        {/* Sur grand écran les deux flèches se rapprochent : écartées de
            600 px aux deux bouts de l'anneau, elles ne se lisaient plus
            comme une paire. Sur téléphone elles restent aux bords, là où
            le pouce les trouve. */}
        <div className="flex items-center justify-between lg:justify-center lg:gap-8">
          <button
            aria-label="Mois précédent"
            onClick={() =>
              setCursor((c) => c && { year: c.month === 0 ? c.year - 1 : c.year, month: (c.month + 11) % 12 })
            }
            className="w-12 h-12 -ml-2 lg:ml-0 flex items-center justify-center text-muted hover:text-foreground"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            aria-label="Mois suivant"
            onClick={() =>
              setCursor((c) => c && { year: c.month === 11 ? c.year + 1 : c.year, month: (c.month + 1) % 12 })
            }
            className="w-12 h-12 -mr-2 lg:mr-0 flex items-center justify-center text-muted hover:text-foreground"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <svg viewBox={`0 0 ${BOX} ${BOX}`} className="w-full h-auto" role="group" aria-label={`Calendrier de ${label} ${cursor.year}`}>
          <circle cx={CENTRE} cy={CENTRE} r={RADIUS} fill="none" stroke="var(--hairline)" />

          {days.map(({ day, date, angle }) => {
            const entry = entries[date];
            const crisis = entry?.had_crisis ?? false;
            // Un jour noté porte un trait franc, un jour laissé vide un trait
            // à peine posé : sans cet écart, l'anneau était identique qu'on
            // ait rempli le mois entier ou rien du tout.
            const logged = Boolean(entry);
            const inner = point(angle, RADIUS - (logged ? 13 : 7));
            const outer = point(angle, RADIUS + (crisis ? 13 : logged ? 7 : 3));
            const med = point(angle, RADIUS + 22);
            const dot = point(angle, RADIUS - 26);
            const lab = point(angle, RADIUS + 38);
            // Tous les cinq jours sur un téléphone, où l'anneau fait 340 px
            // de large et où trente-et-un nombres se toucheraient. À partir
            // de `lg` il en fait le double : chaque jour porte son numéro,
            // les repères de cinq restant plus francs pour garder le rythme.
            const anchor = day === 1 || day % 5 === 0;

            return (
              <g key={date}>
                <line
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={crisis ? "var(--color-coral)" : "var(--color-muted-ink)"}
                  strokeOpacity={crisis ? 1 : logged ? 0.75 : 0.22}
                  strokeWidth={crisis ? 3.5 : logged ? 2 : 1.2}
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
                <text
                  x={lab.x}
                  y={lab.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--color-muted-ink)"
                  fillOpacity={anchor ? 1 : 0.55}
                  // 11 unités sur un anneau de 340 px de large donnent 11 px
                  // à l'écran ; sur l'anneau de 616 px elles en donneraient
                  // 20, et les numéros se mettaient à crier plus fort que
                  // les traits qu'ils repèrent. En unités SVG, donc.
                  className={cn("lg:[font-size:7.5px]", !anchor && "hidden lg:block")}
                >
                  {day}
                </text>
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
            if (!entry) parts.push("rien de noté");
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
      </div>

      {/* Sur téléphone : la suite de l'empilement. Sur grand écran : la
          colonne qui accompagne l'anneau. Mêmes éléments, reflowés. */}
      <aside className="mt-6 lg:mt-0 lg:w-[13rem] lg:shrink-0">
        {/* Le récit du mois n'apparaît qu'au large : c'est la place gagnée
            qui le paie. Sur téléphone, l'anneau et sa légende remplissent
            déjà l'écran, et ces trois phrases le feraient déborder. */}
        <p className="hidden lg:block text-[0.95rem] leading-[2.2] text-muted">
          {month.logged === 0 ? (
            <>Rien de noté pour l&apos;instant sur ce mois.</>
          ) : (
            <>
              <Nombre>{month.logged}</Nombre> journée{month.logged > 1 ? "s" : ""} notée
              {month.logged > 1 ? "s" : ""} sur {month.days}.
              <br />
              <Nombre>{month.crisis}</Nombre> jour{month.crisis > 1 ? "s" : ""} de crise.
              <br />
              Médicament <Nombre>{month.medicated}</Nombre> jour{month.medicated > 1 ? "s" : ""}.
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.8rem] text-muted lg:mt-9 lg:flex-col lg:items-start lg:gap-y-3">
          <span className="flex items-center gap-2">
            <span aria-hidden className="w-4 h-[2px] rounded-full bg-muted/70" /> Journée notée
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden className="w-4 h-[3px] rounded-full bg-accent" /> Crise
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-brass" /> Médicament
          </span>
        </div>

        <p className="text-center text-[0.78rem] text-muted/70 mt-4 lg:text-left lg:mt-7">
          Choisis un jour sur l&apos;anneau pour l&apos;ouvrir.
        </p>
      </aside>
    </div>
  );
}
