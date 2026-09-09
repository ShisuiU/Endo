"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CardLabel } from "@/components/ui/card";
import { fetchEntriesInRange } from "@/lib/entries-client";
import { isoDate, todayISO } from "@/lib/date";

const WINDOW = 7;
const WEEKDAY = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const FULL = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/**
 * Les journées récentes restées vides.
 *
 * On oublie de noter — surtout les jours de crise, justement. Jusqu'ici il
 * fallait ouvrir le calendrier, retrouver le bon jour sur l'anneau et le
 * viser : trois gestes pour rattraper la veille. Ici les jours manquants de
 * la semaine sont posés sur l'accueil, à portée de pouce.
 *
 * Bloc **silencieux quand il n'y a rien à rattraper** : une semaine complète
 * n'affiche rien du tout. C'est une aide, pas un reproche — pas de compteur
 * de série, pas de « tu as raté 3 jours ».
 */
export function MissedDays() {
  const [missing, setMissing] = useState<string[] | null>(null);

  useEffect(() => {
    const today = todayISO();
    const days: string[] = [];
    for (let back = WINDOW; back >= 1; back -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - back);
      days.push(isoDate(d));
    }

    fetchEntriesInRange(days[0], days[days.length - 1])
      .then((rows) => {
        const noted = new Set(rows.map((r) => r.entry_date));
        setMissing(days.filter((d) => d !== today && !noted.has(d)));
      })
      .catch(() => setMissing([]));
  }, []);

  if (!missing || missing.length === 0) return null;

  return (
    <section className="pb-8">
      <CardLabel>À rattraper</CardLabel>
      <ul className="flex flex-wrap gap-2">
        {missing.map((date) => {
          const d = new Date(`${date}T12:00:00`);
          return (
            <li key={date}>
              <Link
                href={`/jour/${date}`}
                aria-label={FULL.format(d)}
                className="flex min-h-[56px] min-w-[56px] flex-col items-center justify-center rounded-2xl px-3 hairline bg-surface transition-colors hover:bg-surface-2"
              >
                <span aria-hidden className="text-[0.6rem] uppercase tracking-[0.12em] text-muted">
                  {WEEKDAY.format(d).replace(".", "")}
                </span>
                <span aria-hidden className="font-display text-[1.35rem] leading-none tabular">
                  {d.getDate()}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
