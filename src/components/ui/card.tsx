import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Carte "carnet" : filet fin, pas d'ombre portée. Le fond blanc-surface
 * se distingue de l'ivoire du canevas sans jamais flotter au-dessus.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("hairline rounded-2xl bg-surface p-5", className)}
      {...props}
    />
  );
}

export function CardLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[0.7rem] uppercase tracking-[0.16em] text-muted mb-2",
        className
      )}
      {...props}
    />
  );
}
