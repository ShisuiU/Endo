"use client";

import { cn } from "@/lib/cn";

/**
 * Réglette de score 0–10.
 *
 * Chaque cran est un bouton de 44 px de haut : c'est la contrainte qui
 * dicte le dessin, pas l'inverse. La version précédente affichait des
 * pastilles de 5 px — élégantes, mais quasi impossibles à viser pendant
 * une crise. Ici la zone tactile est pleine et le cran sélectionné porte
 * son chiffre, donc la valeur reste lisible sans lever les yeux.
 */
export function ScoreSlider({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
}) {
  const steps = Array.from({ length: 11 }, (_, i) => i);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-center gap-2 text-foreground">
          {icon}
          <span className="text-[0.95rem]">{label}</span>
        </div>
        <span
          className={cn(
            "font-display italic text-[1.75rem] leading-none tabular transition-colors",
            value === null ? "text-muted/50" : "text-accent"
          )}
        >
          {value ?? "–"}
        </span>
      </div>

      <div
        role="group"
        aria-label={label}
        className="flex gap-1"
      >
        {steps.map((step) => {
          const selected = step === value;
          const filled = value !== null && step < value;
          return (
            <button
              key={step}
              type="button"
              onClick={() => onChange(step)}
              aria-label={`${label} : ${step} sur 10`}
              aria-pressed={selected}
              className={cn(
                "flex-1 h-11 rounded-[10px] transition-colors flex items-end justify-center pb-1.5 text-[0.7rem] font-medium tabular",
                selected
                  ? "bg-accent text-ground"
                  : filled
                    ? "bg-surface-2 text-transparent"
                    : "bg-surface text-transparent"
              )}
            >
              {step}
            </button>
          );
        })}
      </div>
    </div>
  );
}
