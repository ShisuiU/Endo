import { cn } from "@/lib/cn";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="w-6 h-6 rounded-full border border-brass flex items-center justify-center font-display italic font-bold text-[0.85rem] text-ink leading-none">
        e
      </span>
      <span className="font-display italic text-lg text-foreground">endo</span>
    </span>
  );
}
