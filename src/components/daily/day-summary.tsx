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
    <ul className="hairline-t">
      {items.map((item) => (
        <li key={item.kind === "scores" ? "scores" : item.label} className="hairline-b">
          <button
            type="button"
            onClick={() => onOpen(item.step)}
            className="flex w-full min-h-[56px] items-center gap-4 py-3 text-left text-muted transition-colors hover:text-foreground"
          >
            {item.kind === "scores" ? (
              <span className="grid flex-1 grid-cols-4 gap-2">
                {item.scores.map(({ key, label, value }) => (
                  <span key={key} className="block">
                    <span className="block text-[0.6rem] uppercase tracking-[0.14em]">
                      {label}
                    </span>
                    <span
                      className={cn(
                        "mt-1.5 block font-display italic text-[1.5rem] leading-none tabular",
                        value === null ? "text-muted/45" : "text-foreground"
                      )}
                    >
                      {value ?? "–"}
                    </span>
                  </span>
                ))}
              </span>
            ) : (
              <>
                <span className="w-24 shrink-0 text-[0.6rem] uppercase tracking-[0.14em]">
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
            <ChevronRightIcon className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
