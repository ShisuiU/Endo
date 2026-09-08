"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker (public/sw.js) côté client. Silencieux si le
 * navigateur ne le supporte pas (aucun navigateur ne bloque là-dessus,
 * mais on reste défensif).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Échec de l'enregistrement du service worker", error);
      });
    };
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
