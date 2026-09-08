import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "quiet";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-ground hover:opacity-90 disabled:opacity-45",
  ghost: "hairline text-foreground hover:bg-surface-2 disabled:opacity-40",
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
        // 52 px de haut : confortable au pouce, y compris en crise.
        "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-6 text-[0.95rem] font-medium tracking-[0.01em] transition-opacity disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
