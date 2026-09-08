"use client";

import { cn } from "@/lib/cn";

/**
 * Interrupteur oui/non stylé "carnet" : deux libellés, pas un switch
 * material générique.
 */
export function Toggle({
  value,
  onChange,
  onLabel = "Oui",
  offLabel = "Non",
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <div className="hairline inline-flex rounded-full p-0.5 text-sm">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "rounded-full px-3.5 py-1.5 transition-colors",
          !value ? "bg-ivory-deep text-foreground" : "text-muted"
        )}
      >
        {offLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "rounded-full px-3.5 py-1.5 transition-colors",
          value ? "bg-accent text-ivory" : "text-muted"
        )}
      >
        {onLabel}
      </button>
    </div>
  );
}
