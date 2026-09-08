"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "endo:install-prompt-dismissed";

/**
 * Invite discrète à l'ajout à l'écran d'accueil. Safari iOS n'expose pas
 * `beforeinstallprompt`, donc on explique le geste (Partager → Sur l'écran
 * d'accueil) plutôt que de proposer un faux bouton "Installer" qui ne
 * marcherait pas. Ne s'affiche jamais si l'app tourne déjà en standalone.
 */
export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (isStandalone || !isIOS || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // stockage indisponible (navigation privée) — tant pis, on n'insiste pas cette session
    }
  };

  return (
    <div className="hairline-t bg-surface px-5 py-3 text-sm flex items-start gap-3">
      <span aria-hidden className="mt-0.5 text-accent">
        ⤴
      </span>
      <p className="flex-1 text-muted leading-snug">
        Installe <span className="font-display italic text-foreground">endo</span> sur ton
        écran d&apos;accueil : appuie sur{" "}
        <span className="text-foreground">Partager</span>, puis{" "}
        <span className="text-foreground">Sur l&apos;écran d&apos;accueil</span>.
      </p>
      <button
        onClick={dismiss}
        aria-label="Fermer"
        className="text-muted hover:text-foreground shrink-0"
      >
        ×
      </button>
    </div>
  );
}
