"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CardLabel } from "@/components/ui/card";
import { ChevronRightIcon } from "@/components/icons";
import { fetchEntriesInRange } from "@/lib/entries-client";
import { isoDate, todayISO } from "@/lib/date";

const WINDOW = 7;
const WEEKDAY = new Intl.DateTimeFormat("fr-FR", { weekday: "long" });
const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "long" });
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
 *
 * ⚠️ Première version : des pastilles carrées alignées, façon sélecteur de
 * dates. Motif de tableau de bord standard, rejeté — et à raison, le projet
 * s'interdit exactement ça. Ce sont maintenant des lignes séparées par des
 * filets, avec la date composée comme partout ailleurs dans l'app : chiffre
 * en Bodoni, jour en petites capitales. Ne pas revenir aux vignettes.
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
      <ul className="hairline-t">
        {missing.map((date) => {
          const d = new Date(`${date}T12:00:00`);
          return (
            <li key={date} className="hairline-b">
              <Link
                href={`/jour/${date}`}
                aria-label={FULL.format(d)}
                className="flex min-h-[56px] items-center gap-3 text-muted transition-colors hover:text-foreground"
              >
                <span aria-hidden className="flex items-baseline gap-3">
                  <span className="font-display text-[1.5rem] leading-none text-foreground tabular">
                    {d.getDate()}
                  </span>
                  {/* Le mois n'est écrit qu'au passage d'un mois à l'autre :
                      dans une fenêtre de sept jours, il est presque toujours
                      évident, et l'abréger donnait « DIM SEPT. » — une soupe
                      d'abréviations. */}
                  <span className="text-[0.7rem] uppercase tracking-[0.18em]">
                    {WEEKDAY.format(d)}
                    {d.getMonth() !== new Date().getMonth() ? ` ${MONTH.format(d)}` : ""}
                  </span>
                </span>
                <ChevronRightIcon aria-hidden className="ml-auto h-4 w-4" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
