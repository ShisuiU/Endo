import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "quiet";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-ivory hover:bg-ink-soft disabled:bg-muted disabled:text-ivory/70",
  ghost:
    "border border-foreground/70 text-foreground hover:bg-foreground/5 disabled:opacity-40",
  quiet: "text-muted hover:text-foreground disabled:opacity-40",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ className, variant = "primary", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
