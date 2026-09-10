"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Les écrans qui ont le droit de dépasser la colonne de lecture quand
 * l'écran est large.
 *
 * Le carnet (accueil, une journée, réglages) est du texte : il garde la
 * mesure d'une colonne de magazine, l'élargir le rendrait illisible. Le
 * calendrier et les repères, eux, sont des **figures** — un anneau et des
 * courbes — et une figure a besoin de place.
 */
const WIDE = ["/calendrier", "/statistiques"];

/**
 * La colonne partagée par l'en-tête et le contenu.
 *
 * Même composant des deux côtés, et donc **même axe** : le logotype, la
 * navigation et le bord gauche du texte sont toujours alignés. C'est la
 * raison d'être de ce fichier — si la largeur était décidée écran par
 * écran, l'en-tête resterait à 34 rem pendant que les repères s'étaleraient
 * à 58, et le titre de section démarrerait 17 rem à gauche du logotype.
 *
 * La largeur suit la route, pas l'appui : le changement de largeur tombe
 * pile au moment où le contenu est remplacé par la coquille de chargement,
 * donc il ne se voit pas.
 */
export function ReadingColumn({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const wide = WIDE.some((route) => pathname?.startsWith(route));

  return (
    <div className={cn("mx-auto w-full max-w-[34rem]", wide && "lg:max-w-[58rem]", className)}>
      {children}
    </div>
  );
}
