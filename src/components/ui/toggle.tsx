"use client";

import { cn } from "@/lib/cn";

/**
 * Choix binaire en deux pilules de 52 px — pas un switch material, et pas
 * un interrupteur minuscule : les deux options sont nommées et visées
 * aussi facilement l'une que l'autre.
 */
export function Toggle({
  value,
  onChange,
  onLabel = "Oui",
  offLabel = "Non",
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  label?: string;
}) {
  return (
    <div className="flex gap-2" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={!value}
        className={cn(
          "flex-1 min-h-[52px] rounded-full px-4 text-[0.95rem] transition-colors hairline",
          !value ? "bg-surface-2 text-foreground" : "text-muted"
        )}
      >
        {offLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={value}
        className={cn(
          "flex-1 min-h-[52px] rounded-full px-4 text-[0.95rem] font-medium transition-colors",
          value
            ? "bg-accent text-ground border border-accent"
            : "hairline text-muted"
        )}
      >
        {onLabel}
      </button>
    </div>
  );
}
