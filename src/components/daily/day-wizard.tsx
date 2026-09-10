"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ScoreSlider } from "@/components/ui/score-slider";
import { Toggle } from "@/components/ui/toggle";
import { TagInput } from "@/components/ui/tag-input";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, CloseIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

type Common = { id: string; title: string; hint: string };

export type WizardStep = Common &
  (
    | { kind: "score"; value: number | null; onChange: (value: number) => void }
    | {
        kind: "toggle";
        value: boolean;
        offLabel: string;
        onLabel: string;
        onChange: (value: boolean) => void;
        /** Champ libre qui n'apparaît que si la réponse est « oui ». */
        detail?: {
          value: string;
          placeholder: string;
          onChange: (value: string) => void;
          /** Le dernier médicament écrit, à reprendre d'un mot. */
          habit?: string | null;
        };
      }
    | {
        kind: "tags";
        values: string[];
        placeholder: string;
        onChange: (values: string[]) => void;
        /** Ce qui revient souvent, à ajouter d'un mot. */
        habits?: string[];
      }
    | { kind: "text"; value: string; placeholder: string; onChange: (value: string) => void }
  );

/**
 * La journée entière, une question par écran.
 *
 * L'écran d'accueil était un long formulaire : crise, intensité, quatre
 * notes, médicament, aliments, notes libres, tout empilé. Il faut alors
 * décider soi-même par où commencer, et la page se déroule sans fin.
 * Ici on répond à ce qu'on a sous les yeux, et l'accueil ne montre plus que
 * le résumé de ce qui a été dit.
 *
 * Trois règles tiennent le parcours :
 *  — **rien n'est obligatoire** : « Suivant » avance toujours, une note peut
 *    rester vide (« non renseigné », jamais zéro) ;
 *  — **chaque réponse part vers le brouillon tout de suite**, pas à la fin :
 *    on peut fermer au milieu sans rien perdre, ce qui compte quand on
 *    abandonne parce que la douleur reprend ;
 *  — **les questions sans objet disparaissent** : pas d'intensité s'il n'y a
 *    pas eu de crise, pas de détail de médicament s'il n'y en a pas eu. La
 *    liste des étapes est recalculée à chaque réponse.
 *
 * L'animation ne touche qu'`opacity` et `transform`, jamais la géométrie
 * (leçon de la barre de navigation), et disparaît sous
 * `prefers-reduced-motion`.
 */
export function DayWizard({
  steps,
  startAt = 0,
  onClose,
}: {
  steps: WizardStep[];
  startAt?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(() => Math.min(Math.max(startAt, 0), steps.length - 1));
  const [forward, setForward] = useState(true);
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);

  // Répondre « non » à la crise retire l'étape « intensité » : l'index
  // courant pourrait alors pointer au-delà de la liste.
  const safeIndex = Math.min(index, steps.length - 1);
  const step = steps[safeIndex];
  const last = safeIndex === steps.length - 1;

  // Le focus entre dans le dialogue **à l'ouverture, une seule fois**. Il
  // était rendu au dialogue à chaque réponse tant qu'il partageait l'effet
  // ci-dessous, dont la dépendance change à chaque rendu du parent : au
  // clavier, une seule flèche était prise en compte, les suivantes tombaient
  // dans le vide.
  useEffect(() => {
    panel.current?.focus();
  }, []);

  // Échap ferme, et le défilement de la page dessous est bloqué le temps du
  // parcours — sinon un doigt qui dérape fait défiler le formulaire.
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

  const go = useCallback(
    (next: number) => {
      if (next < 0) return;
      if (next >= steps.length) return onClose();
      setForward(next > safeIndex);
      setIndex(next);
    },
    [safeIndex, steps.length, onClose]
  );

  const slide = reduce ? 0 : forward ? 28 : -28;

  return (
    <>
      {/* Voile : seulement là où le panneau ne couvre pas tout l'écran. */}
      <div aria-hidden className="fixed inset-0 z-40 hidden bg-ground/90 md:block" />
      <div
      role="dialog"
      aria-modal="true"
      aria-label="Résumé de la journée"
      ref={panel}
      tabIndex={-1}
      // Plein écran au téléphone — c'est le geste principal, il mérite tout
      // l'écran. Sur large, la même colonne de lecture que le reste de l'app,
      // bordée de deux filets : une **colonne de page**, pas une carte
      // flottante (le projet n'en veut pas, voir CLAUDE.md). Une question
      // seule au milieu de 1440 px serait perdue.
      className="fixed inset-0 z-50 flex flex-col bg-background outline-none
        md:left-1/2 md:w-[34rem] md:-translate-x-1/2 md:border-x md:border-[color:var(--hairline)]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header className="flex items-center justify-between px-4 pt-3">
        <button
          type="button"
          onClick={() => go(safeIndex - 1)}
          disabled={safeIndex === 0}
          aria-label="Question précédente"
          className="flex h-12 w-12 items-center justify-center text-muted hover:text-foreground disabled:opacity-0"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-muted tabular">
          {safeIndex + 1} / {steps.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le résumé"
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
            key={s.id}
            className={cn(
              "h-[3px] flex-1 rounded-full transition-colors duration-300",
              i < safeIndex ? "bg-accent/45" : i === safeIndex ? "bg-accent" : "bg-surface-2"
            )}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-6">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slide }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <h2 className="font-display text-[2.6rem] leading-[1.05] tracking-[-0.02em]">
              {step.title}
            </h2>
            <p className="mt-3 mb-9 text-[0.9rem] leading-relaxed text-muted">{step.hint}</p>
            <StepField step={step} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="px-6 pt-2"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <Button className="w-full" onClick={() => go(safeIndex + 1)}>
          {last ? "Terminer" : "Suivant"}
        </Button>
        <p className="mt-4 text-center text-[0.75rem] text-muted">
          Tout est enregistré en direct — tu peux t&apos;arrêter là où tu veux.
        </p>
      </div>
      </div>
    </>
  );
}

/**
 * Ce qui revient souvent, proposé **en toutes lettres**.
 *
 * Le catalogue 21st donne deux réponses à ce besoin, et ce sont exactement
 * les deux à éviter ici : la liste déroulante d'autocomplétion sous le
 * champ, et la rangée de pastilles — ce second motif étant, dans huit
 * résultats sur dix, la rangée de suggestions d'un chat d'IA. Autant signer
 * l'app.
 *
 * L'app a déjà sa manière de rendre un mot tapable : le résumé du jour, où
 * chaque fragment de phrase rouvre sa question. On la reprend. Ce sont des
 * cibles *en ligne dans un texte* (exemptées de la taille minimale par
 * WCAG 2.5.8) — mais on ne s'en contente pas : 1 rem sur un interligne de
 * 2.8 donne des mots de **44,8 px de haut**, mesurés. À 0.95 rem et 2.6,
 * ils n'en faisaient que 40, et c'est bien la règle des 44 px qui a motivé
 * toute la refonte de l'app.
 */
function Habitudes({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-[1rem] leading-[2.8] text-muted">{children}</p>;
}

/** Un mot d'habitude, tapable — même traitement que dans le résumé du jour. */
function Mot({ children, onPick }: { children: ReactNode; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="text-left text-foreground underline decoration-[color:var(--hairline)] underline-offset-[6px] transition-colors hover:decoration-accent"
    >
      {children}
    </button>
  );
}

function StepField({ step }: { step: WizardStep }) {
  if (step.kind === "score")
    return (
      <ScoreSlider label={step.title} labelHidden value={step.value} onChange={step.onChange} />
    );

  if (step.kind === "toggle")
    return (
      <div>
        <Toggle
          label={step.title}
          value={step.value}
          onChange={step.onChange}
          offLabel={step.offLabel}
          onLabel={step.onLabel}
        />
        {step.detail && step.value && (
          <>
            <label className="mt-4 block">
              <span className="sr-only">{step.detail.placeholder}</span>
              <input
                value={step.detail.value}
                onChange={(event) => step.detail?.onChange(event.target.value)}
                placeholder={step.detail.placeholder}
                className="min-h-[52px] w-full rounded-2xl bg-surface px-4 text-[0.95rem] outline-none hairline focus:border-accent/60"
              />
            </label>
            {/* Le champ vide seulement : une fois qu'on écrit, une
                proposition qui reste affichée devient du bruit. */}
            {step.detail.habit && step.detail.value.trim() === "" && (
              <Habitudes>
                La dernière fois :{" "}
                <Mot onPick={() => step.detail?.onChange(step.detail.habit ?? "")}>
                  {step.detail.habit}
                </Mot>
                .
              </Habitudes>
            )}
          </>
        )}
      </div>
    );

  if (step.kind === "tags") {
    const reste = (step.habits ?? []).filter((food) => !step.values.includes(food));
    return (
      <div>
        <TagInput values={step.values} onChange={step.onChange} placeholder={step.placeholder} />
        {reste.length > 0 && (
          <Habitudes>
            Souvent :{" "}
            {reste.map((food, i) => (
              <span key={food}>
                <Mot onPick={() => step.onChange([...step.values, food])}>{food}</Mot>
                {i === reste.length - 1 ? "." : ", "}
              </span>
            ))}
          </Habitudes>
        )}
      </div>
    );
  }

  return (
    <label>
      <span className="sr-only">{step.title}</span>
      <textarea
        value={step.value}
        onChange={(event) => step.onChange(event.target.value)}
        placeholder={step.placeholder}
        rows={5}
        className="w-full resize-none rounded-2xl bg-surface p-4 text-[0.95rem] outline-none hairline focus:border-accent/60 placeholder:text-muted/70"
      />
    </label>
  );
}
