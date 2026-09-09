"use client";

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
 * tombe à une capsule, le nom n'apparaît que là où il sert — sur l'écran
 * où l'on est — et la pastille glisse d'un onglet à l'autre, ce qui montre
 * le déplacement au lieu de le faire deviner.
 *
 * Trois choses tiennent le dessin :
 *  — la capsule est `sticky` : elle reste au pouce quel que soit le
 *    défilement, sans jamais recouvrir la fin du formulaire (une position
 *    collante garde sa place dans le flux) ;
 *  — chaque cible fait 56 px de haut, y compris les onglets réduits à leur
 *    icône, avec la marge de sécurité iOS sous la capsule ;
 *  — le libellé visible est marqué `aria-hidden`, le nom complet passe par
 *    `aria-label` : un lecteur d'écran annonce les trois destinations de la
 *    même façon, qu'elles soient ouvertes ou repliées.
 *
 * L'animation est portée par `motion` (déjà présent pour la réglette) et
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

  return (
    <div
      className="sticky bottom-0 z-30 px-4 pt-8 bg-gradient-to-t from-background via-background to-transparent"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex w-full max-w-[22rem] items-center gap-1 rounded-full hairline bg-surface/80 p-1.5 backdrop-blur"
      >
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href) ?? false;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[56px] items-center justify-center rounded-full transition-colors duration-200",
                // L'onglet actif prend la place restante — la zone tapable
                // s'élargit avec lui, la pastille visible reste ajustée à son
                // libellé.
                active ? "flex-1 text-accent" : "w-14 shrink-0 text-muted hover:text-foreground"
              )}
            >
              <motion.span
                layout
                layoutId={active ? "nav-pill" : undefined}
                transition={transition}
                className={cn(
                  "flex min-h-[48px] items-center justify-center gap-2 rounded-full px-4",
                  active && "bg-surface-2 hairline"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <AnimatePresence initial={false}>
                  {active && (
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
