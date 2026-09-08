import { cn } from "@/lib/cn";

/** Logotype : "endo" en Libre Bodoni italique. Le mot seul, sans cartouche —
 *  c'est le contraste de la lettre qui porte l'identité. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display italic text-[1.6rem] leading-none tracking-[-0.01em] text-foreground",
        className
      )}
    >
      endo
    </span>
  );
}
