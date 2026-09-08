"use client";

import { cn } from "@/lib/cn";

/**
 * Réglette de score 0–10 maison : une ligne de repères tactiles reliée par
 * un filet, un marqueur rosewood qui se déplace, le chiffre en Fraunces au
 * survol/actif. Volontairement pas un <input type="range"> par défaut.
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
  const filledTo = value ?? -1;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-foreground">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span
          className={cn(
            "font-display italic text-2xl tabular leading-none transition-colors",
            value === null ? "text-muted/50" : "text-accent"
          )}
        >
          {value ?? "–"}
        </span>
      </div>
      <div
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value ?? undefined}
        className="relative flex items-center justify-between h-9"
      >
        <div className="absolute left-0 right-0 h-px bg-hairline top-1/2 -translate-y-1/2" />
        <div
          className="absolute left-0 h-px bg-accent top-1/2 -translate-y-1/2 transition-all"
          style={{ width: filledTo >= 0 ? `${(filledTo / 10) * 100}%` : 0 }}
        />
        {steps.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            aria-label={`${label} : ${step}`}
            className="relative z-10 flex items-center justify-center w-4 h-9 -mx-0"
          >
            <span
              className={cn(
                "rounded-full transition-all",
                step === value
                  ? "w-3.5 h-3.5 bg-accent"
                  : "w-[5px] h-[5px] bg-muted/50"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
