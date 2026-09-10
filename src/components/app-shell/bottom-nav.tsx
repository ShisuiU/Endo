"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { NAV_ITEMS, useActiveHref } from "@/components/app-shell/nav-items";
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
 *     (`flex-1 min-w-0`), et la pastille occupe précisément le sien
 *     (`absolute inset-0`). Deux versions ont échoué avant : l'une
 *     élargissait l'onglet actif — les icônes voisines sautaient d'un coup en
 *     CSS pendant que la pastille glissait sur un ressort ; l'autre laissait
 *     la pastille s'ajuster à son libellé — elle débordait alors de la
 *     capsule, visiblement, dans le coin arrondi. À taille fixe, la pastille
 *     ne fait plus que se translater : elle reste dedans (les deux tracés
 *     sont concentriques, 6 px d'écart partout) et l'animation est un simple
 *     déplacement.
 *  2. **La pastille suit l'appui, pas le serveur.** Les écrans sont rendus
 *     dynamiquement : un changement d'onglet demande un aller-retour de 400 à
 *     900 ms. Attendre `usePathname` pour déplacer la pastille rendait la
 *     barre inerte pendant tout ce temps. On note la destination à l'appui,
 *     et la vraie route reprend la main dès qu'elle arrive.
 *
 *  3. **Pas de `backdrop-blur` sur la capsule.** Un fond flouté qui se
 *     recalcule à chaque image pendant qu'un libellé s'ouvre au-dessus, c'est
 *     ce qui rendait le texte saccadé sur iPhone — Safari repeint toute la
 *     zone floutée à chaque frame. La capsule est opaque ; le dégradé du
 *     conteneur suffit à décoller le contenu qui passe derrière.
 *
 * Le reste : cibles de 56 px, capsule `sticky` (elle garde sa place dans le
 * flux, donc ne recouvre jamais la fin du formulaire), libellé visible en
 * `aria-hidden` et nom complet en `aria-label` pour que les trois
 * destinations s'annoncent pareil, ouvertes ou repliées. L'animation
 * s'efface entièrement sous `prefers-reduced-motion`.
 */
const GLIDE = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 } as const;

export function BottomNav() {
  const { active: activeHref, onTap } = useActiveHref();
  const reduce = useReducedMotion();
  const transition = reduce ? { duration: 0 } : GLIDE;

  return (
    <div
      // Masquée sur écran large : la navigation passe dans l'en-tête, une
      // barre au pouce n'a pas de sens avec une souris.
      className="md:hidden sticky bottom-0 z-30 px-3 pt-8 bg-gradient-to-t from-background via-background to-transparent"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex w-full max-w-[24rem] items-center rounded-full hairline bg-surface p-1.5"
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const on = activeHref === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={on ? "page" : undefined}
              onClick={() => onTap(href)}
              className={cn(
                "relative flex min-h-[56px] min-w-0 flex-1 items-center justify-center rounded-full transition-colors duration-200",
                on ? "text-accent" : "text-muted hover:text-foreground"
              )}
            >
              {on && (
                <motion.span
                  layoutId="nav-pill"
                  aria-hidden
                  transition={transition}
                  className="absolute inset-0 rounded-full bg-surface-2 hairline"
                />
              )}
              <span className="relative flex min-w-0 items-center justify-center gap-1.5 px-1">
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
                      className="overflow-hidden whitespace-nowrap text-[0.8rem]"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
