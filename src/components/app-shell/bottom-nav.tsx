"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ChartIcon, NoteIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/aujourdhui", label: "Aujourd'hui", Icon: NoteIcon },
  { href: "/calendrier", label: "Calendrier", Icon: CalendarIcon },
  { href: "/statistiques", label: "Repères", Icon: ChartIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hairline-t bg-surface/95 backdrop-blur px-6 pt-2 flex justify-around"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 px-3 text-[0.68rem] tracking-wide transition-colors",
              active ? "text-ink" : "text-muted"
            )}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 1.8 : 1.4} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
