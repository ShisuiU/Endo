"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Navigation basse : libellés seuls, surmontés d'une barre d'accent quand
 * l'onglet est actif. Pas d'icônes ici — trois mots courts sont plus
 * lisibles que trois pictogrammes à deviner, et ça laisse le dessin
 * respirer. Chaque cible fait 56 px, avec la marge de sécurité iOS.
 */
const ITEMS = [
  { href: "/aujourdhui", label: "Aujourd'hui" },
  { href: "/calendrier", label: "Calendrier" },
  { href: "/statistiques", label: "Repères" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hairline-t bg-background/95 backdrop-blur flex px-3 pt-2"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {ITEMS.map(({ href, label }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex-1 min-h-[56px] flex flex-col items-center justify-center gap-2 text-[0.8rem] transition-colors",
              active ? "text-foreground" : "text-muted"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "block h-[2px] w-6 rounded-full",
                active ? "bg-accent" : "bg-transparent"
              )}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
