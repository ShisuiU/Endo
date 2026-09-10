import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Un nombre dans le fil du texte, composé comme les dates et les scores.
 *
 * En couleur de texte, pas en corail : sur un écran qui porte déjà un
 * accent (l'intervalle entre crises, par exemple), trois nombres coraux de
 * plus et plus aucun ne ressort. Ici la hiérarchie vient de la taille et de
 * la police, pas de la couleur.
 *
 * ⚠️ C'est le remplaçant des vignettes de chiffres : dans ce projet, un
 * nombre ne se met pas dans une boîte. Voir CLAUDE.md § Le jour où deux
 * blocs génériques sont passés.
 */
export function Nombre({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "font-display italic text-[1.6rem] leading-none text-foreground tabular",
        className
      )}
    >
      {children}
    </span>
  );
}
