import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Bloc de contenu : filet fin sur fond légèrement relevé, jamais d'ombre
 * portée. Sur fond sombre, c'est l'écart de valeur qui sépare les plans.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("hairline rounded-2xl bg-surface p-5", className)} {...props} />
  );
}

/** Intertitre en petites capitales très espacées — le repère éditorial. */
export function CardLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[0.65rem] uppercase tracking-[0.22em] text-muted mb-4",
        className
      )}
      {...props}
    />
  );
}
