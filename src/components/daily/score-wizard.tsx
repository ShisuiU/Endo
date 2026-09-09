"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ScoreSlider } from "@/components/ui/score-slider";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, CloseIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export type ScoreStep = {
  key: string;
  label: string;
  /** Ce que la note veut dire, pour ne pas avoir à le deviner à 3 h du matin. */
  hint: string;
  value: number | null;
};

/**
 * Évaluation de la journée, une note par écran.
 *
 * Quatre réglettes empilées sur la page d'accueil demandaient de tenir
 * quatre questions en tête d'un coup. Une par écran, avec « Suivant » : on
 * répond à ce qu'on a sous les yeux, et l'écran d'accueil redevient lisible.
 *
 * Chaque note part vers le brouillon dès qu'on la bouge — pas à la fin. On
 * peut donc fermer au milieu sans rien perdre, ce qui compte quand on
 * abandonne parce que la douleur reprend. « Suivant » n'exige rien : une
 * note peut rester vide, elle vaut « non renseigné », pas zéro.
 *
 * L'animation ne touche qu'`opacity` et `transform` (jamais la géométrie),
 * et disparaît sous `prefers-reduced-motion`.
 */
export function ScoreWizard({
  steps,
  startAt = 0,
  onChange,
  onClose,
}: {
  steps: ScoreStep[];
  startAt?: number;
  onChange: (key: string, value: number) => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(() => Math.min(Math.max(startAt, 0), steps.length - 1));
  const [forward, setForward] = useState(true);
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  const go = useCallback(
    (next: number) => {
      if (next < 0) return;
      if (next >= steps.length) return onClose();
      setForward(next > index);
      setIndex(next);
    },
    [index, steps.length, onClose]
  );

  // Le focus entre dans le dialogue **à l'ouverture, une seule fois**. Il
  // était rendu au dialogue à chaque note saisie tant qu'il partageait
  // l'effet ci-dessous, dont la dépendance change à chaque rendu du parent :
  // au clavier, une seule flèche était prise en compte, les suivantes
  // tombaient dans le vide.
  useEffect(() => {
    panel.current?.focus();
  }, []);

  // Échap ferme, et le défilement de la page dessous est bloqué le temps de
  // l'évaluation — sinon un doigt qui dérape fait défiler le formulaire.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const slide = reduce ? 0 : forward ? 28 : -28;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Évaluation de la journée"
      ref={panel}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-background outline-none"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header className="flex items-center justify-between px-4 pt-3">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Question précédente"
          className="flex h-12 w-12 items-center justify-center text-muted hover:text-foreground disabled:opacity-0"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-muted tabular">
          {index + 1} / {steps.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer l'évaluation"
          className="flex h-12 w-12 items-center justify-center text-muted hover:text-foreground"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Avancement en segments plutôt qu'en barre : on voit le nombre de
          questions restantes, pas un pourcentage abstrait. */}
      <div className="flex gap-1.5 px-6 pt-4" aria-hidden>
        {steps.map((s, i) => (
          <span
            key={s.key}
            className={cn(
              "h-[3px] flex-1 rounded-full transition-colors duration-300",
              i < index ? "bg-accent/45" : i === index ? "bg-accent" : "bg-surface-2"
            )}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 pb-4">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slide }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <h2 className="font-display text-[2.6rem] leading-[1.05] tracking-[-0.02em]">
              {step.label}
            </h2>
            <p className="mt-3 mb-10 text-[0.9rem] leading-relaxed text-muted">{step.hint}</p>
            <ScoreSlider
              label={step.label}
              labelHidden
              value={step.value}
              onChange={(v) => onChange(step.key, v)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="px-6 pt-2"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <Button className="w-full" onClick={() => go(index + 1)}>
          {last ? "Terminer" : "Suivant"}
        </Button>
        <p className="mt-4 text-center text-[0.75rem] text-muted">
          Chaque note est enregistrée en direct — tu peux t&apos;arrêter là où tu veux.
        </p>
      </div>
    </div>
  );
}
