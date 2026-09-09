"use client";

import { useCallback, useEffect } from "react";
import { currentUserId } from "@/lib/entries-client";
import { flushPending } from "@/lib/pending-entries";

/**
 * Remonte en arrière-plan les journées restées en attente sur l'appareil.
 *
 * Sans ça, une journée saisie hors-ligne ne repartirait qu'en rouvrant
 * exactement cet écran-là. Monté dans la zone connectée, ce composant
 * rattrape tout le retard dès qu'une session est ouverte et à chaque
 * retour du réseau. Il n'affiche rien : c'est de l'entretien, pas une
 * information à donner.
 */
export function PendingSync() {
  const flush = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    const uid = await currentUserId();
    if (uid) await flushPending(uid);
  }, []);

  useEffect(() => {
    void flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [flush]);

  return null;
}
