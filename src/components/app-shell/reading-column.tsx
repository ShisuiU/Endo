import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * La colonne de lecture, partagée par l'en-tête et le contenu.
 *
 * L'app est dessinée pour 390 px de large ; sans borne, une fenêtre de
 * 1440 px étirait le texte sur toute la largeur (mesure de lecture
 * illisible) et donnait un bouton principal de 1400 px. 34 rem, c'est la
 * largeur d'une colonne de magazine — l'app reste un carnet, elle ne devient
 * pas un tableau de bord parce que l'écran est grand.
 *
 * ⚠️ **Cette largeur est la même sur toutes les routes, et doit le rester.**
 * Une version l'a fait varier — 58 rem sur le calendrier et les repères, qui
 * sont des figures — en espérant garder le logotype aligné sur le bord
 * gauche de leur contenu. Mesuré ensuite : à 1440 px, la **navigation se
 * déplaçait de 192 px** d'un onglet à l'autre. C'est l'élément qu'on vise à
 * la souris ; le voir sauter entre deux clics coûte infiniment plus cher que
 * le petit décalage d'alignement que ça réglait. Les figures dépassent
 * maintenant toutes seules (voir `MonthRing`), le cadre ne bouge plus.
 */
export function ReadingColumn({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("mx-auto w-full max-w-[34rem]", className)}>{children}</div>;
}
