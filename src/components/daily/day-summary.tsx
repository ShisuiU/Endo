"use client";

import { ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/** Bloc des quatre notes, en chiffres. */
export type SummaryScores = {
  kind: "scores";
  step: number;
  scores: { key: string; label: string; value: number | null }[];
};

/** Ligne « libellé — valeur ». */
export type SummaryRow = {
  kind: "row";
  step: number;
  label: string;
  value: string;
  /** Grise la valeur quand rien n'a été renseigné. */
  empty?: boolean;
  accent?: boolean;
};

export type SummaryItem = SummaryScores | SummaryRow;

/**
 * Le résumé du jour sur l'écran d'accueil.
 *
 * L'accueil ne sert plus à saisir — tout passe par le parcours pas à pas —
 * mais à **relire** : ce qui a été dit de la journée, d'un coup d'œil, sans
 * dérouler. Chaque ligne reste tapable et ouvre le parcours directement à
 * sa question, pour corriger sans repasser par tout le reste.
 *
 * L'ordre des blocs est celui du parcours, et c'est le parent qui le donne :
 * on relit dans l'ordre où on a répondu. Les quatre notes ont leur propre
 * bloc en chiffres — ce sont elles qu'on relit le plus, et un chiffre se lit
 * plus vite qu'une phrase.
 */
export function DaySummary({
  items,
  onOpen,
}: {
  items: SummaryItem[];
  onOpen: (step: number) => void;
}) {
  return (
    <div className="hairline overflow-hidden rounded-2xl bg-surface">
      {items.map((item, i) => (
        <button
          key={item.kind === "scores" ? "scores" : item.label}
          type="button"
          onClick={() => onOpen(item.step)}
          className={cn(
            "flex w-full min-h-[56px] items-center gap-4 px-5 text-left transition-colors hover:bg-surface-2",
            item.kind === "scores" ? "py-4" : "py-3.5",
            i > 0 && "hairline-t"
          )}
        >
          {item.kind === "scores" ? (
            <span className="grid flex-1 grid-cols-4 gap-2">
              {item.scores.map(({ key, label, value }) => (
                <span key={key} className="block">
                  <span className="block text-[0.6rem] uppercase tracking-[0.14em] text-muted">
                    {label}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block font-display italic text-[1.5rem] leading-none tabular",
                      value === null ? "text-muted/45" : "text-accent"
                    )}
                  >
                    {value ?? "–"}
                  </span>
                </span>
              ))}
            </span>
          ) : (
            <>
              <span className="w-28 shrink-0 text-[0.6rem] uppercase tracking-[0.14em] text-muted">
                {item.label}
              </span>
              <span
                className={cn(
                  "flex-1 truncate text-[0.9rem]",
                  item.empty ? "text-muted/45" : item.accent ? "text-accent" : "text-foreground"
                )}
              >
                {item.value}
              </span>
            </>
          )}
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        </button>
      ))}
    </div>
  );
}
