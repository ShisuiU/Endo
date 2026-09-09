import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * ⚠️ Il n'y a **pas** de composant `Card` dans ce projet, et c'est
 * volontaire.
 *
 * Il en a existé un — bloc arrondi sur fond relevé — jusqu'à ce que
 * l'utilisatrice rejette les trois derniers endroits qui s'en servaient :
 * « des blocs qui ressemblent à n'importe quelle IA » (voir CLAUDE.md
 * § Le jour où deux blocs génériques sont passés). La page est un carnet,
 * pas un tableau de bord : ce qui sépare les plans, ce sont les filets fins
 * et la typographie, jamais un cadre.
 *
 * Reste ici l'intertitre, qui lui n'a rien d'une carte.
 */

/** Intertitre en petites capitales très espacées — le repère éditorial. */
export function CardLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[0.65rem] uppercase tracking-[0.22em] text-muted mb-4",
        className
      )}
      {...props}
    />
  );
}
