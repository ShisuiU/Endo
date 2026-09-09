"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { JournalIcon, RingIcon, TrendIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Navigation basse en capsule : les trois écrans sont des pictogrammes, et
 * seul l'écran courant s'ouvre en pastille pour dire son nom.
 *
 * Pourquoi ce parti pris : la barre à trois libellés occupait toute la
 * largeur pour répéter en permanence ce qu'on sait déjà. Ici l'encombrement
 * tombe à une capsule, le nom n'apparaît que là où il sert, et la pastille
 * glisse d'un onglet à l'autre — on voit le déplacement au lieu de le
 * deviner.
 *
 * Deux points de géométrie, appris à l'usage :
 *
 *  1. **Les trois emplacements font exactement le même tiers de la barre**
 *     (`flex-1 min-w-0`), et la pastille se contente de déborder du sien.
 *     Une première version élargissait l'onglet actif : les icônes voisines
 *     se décalaient d'un coup, en CSS, pendant que la pastille glissait, elle,
 *     sur un ressort — deux mouvements désaccordés. Ici rien ne bouge sauf la
 *     pastille.
 *  2. **La pastille suit l'appui, pas le serveur.** Les écrans sont rendus
 *     dynamiquement : un changement d'onglet demande un aller-retour de 400 à
 *     900 ms. Attendre `usePathname` pour déplacer la pastille rendait la
 *     barre inerte pendant tout ce temps. On note la destination à l'appui,
 *     et la vraie route reprend la main dès qu'elle arrive.
 *
 * Le reste : cibles de 56 px, capsule `sticky` (elle garde sa place dans le
 * flux, donc ne recouvre jamais la fin du formulaire), libellé visible en
 * `aria-hidden` et nom complet en `aria-label` pour que les trois
 * destinations s'annoncent pareil, ouvertes ou repliées. L'animation
 * s'efface entièrement sous `prefers-reduced-motion`.
 */
const ITEMS = [
  { href: "/aujourdhui", label: "Aujourd'hui", Icon: JournalIcon },
  { href: "/calendrier", label: "Calendrier", Icon: RingIcon },
  { href: "/statistiques", label: "Repères", Icon: TrendIcon },
] as const;

const GLIDE = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 } as const;

export function BottomNav() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const transition = reduce ? { duration: 0 } : GLIDE;

  const routed = ITEMS.find((item) => pathname?.startsWith(item.href))?.href ?? null;
  const [tapped, setTapped] = useState<string | null>(null);
  // Dès que la route demandée est arrivée, c'est elle qui fait foi — on lâche
  // la destination optimiste (ajustement d'état pendant le rendu, sans effet
  // ni rendu intermédiaire visible).
  const lastRouted = useRef(routed);
  if (lastRouted.current !== routed) {
    lastRouted.current = routed;
    if (tapped !== null) setTapped(null);
  }
  const active = tapped ?? routed;

  return (
    <div
      className="sticky bottom-0 z-30 px-4 pt-8 bg-gradient-to-t from-background via-background to-transparent"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex w-full max-w-[22rem] items-center rounded-full hairline bg-surface/80 p-1.5 backdrop-blur"
      >
        {ITEMS.map(({ href, label, Icon }) => {
          const on = active === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={on ? "page" : undefined}
              onClick={() => setTapped(href)}
              className={cn(
                "flex min-h-[56px] min-w-0 flex-1 items-center justify-center rounded-full transition-colors duration-200",
                on ? "text-accent" : "text-muted hover:text-foreground"
              )}
            >
              <motion.span
                layout
                layoutId={on ? "nav-pill" : undefined}
                transition={transition}
                className={cn(
                  "flex min-h-[48px] items-center justify-center gap-2 rounded-full px-4",
                  on && "bg-surface-2 hairline"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.span
                      key="label"
                      aria-hidden
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={transition}
                      className="overflow-hidden whitespace-nowrap text-[0.85rem]"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
