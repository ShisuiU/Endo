"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { JournalIcon, RingIcon, TrendIcon } from "@/components/icons";

/** Les trois destinations, partagées par la barre du pouce et celle du haut. */
export const NAV_ITEMS = [
  { href: "/accueil", label: "Accueil", Icon: JournalIcon },
  { href: "/calendrier", label: "Calendrier", Icon: RingIcon },
  { href: "/statistiques", label: "Repères", Icon: TrendIcon },
] as const;

/**
 * L'onglet à montrer comme actif — **celui qu'on vient de toucher**, pas
 * celui que le serveur a fini par renvoyer.
 *
 * Les écrans sont rendus dynamiquement : un changement d'onglet demande un
 * aller-retour. Attendre `usePathname` rendait la barre inerte pendant ce
 * temps-là. On note la destination à l'appui, et la vraie route reprend la
 * main dès qu'elle arrive.
 */
export function useActiveHref() {
  const pathname = usePathname();
  const routed = NAV_ITEMS.find((item) => pathname?.startsWith(item.href))?.href ?? null;
  const [tapped, setTapped] = useState<string | null>(null);

  // Ajustement d'état pendant le rendu (sans effet ni rendu intermédiaire
  // visible) : dès que la route demandée arrive, c'est elle qui fait foi.
  const lastRouted = useRef(routed);
  if (lastRouted.current !== routed) {
    lastRouted.current = routed;
    if (tapped !== null) setTapped(null);
  }

  return { active: tapped ?? routed, onTap: setTapped };
}
