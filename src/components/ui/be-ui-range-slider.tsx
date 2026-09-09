"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";

/**
 * Réglette à poignée, adaptée d'un composant du catalogue 21st.
 *
 * Deux écarts assumés par rapport à l'original :
 *  — la piste fait 48 px de haut (l'original 40) pour rester au-dessus du
 *    seuil tactile de 44 px tenu par tout le reste de l'app ;
 *  — les couleurs passent par les tokens Nocturne plutôt que par les
 *    variables shadcn (`bg-muted`, `bg-foreground/15`) absentes du projet.
 *
 * Point d'accessibilité qui compte ici : un appui simple n'importe où sur
 * la piste positionne la valeur, sans glisser. C'est ce qui satisfait le
 * critère WCAG 2.2 « Dragging Movements » (2.5.7) — et, plus concrètement,
 * ce qui rend la réglette utilisable d'une main pendant une crise.
 */

const SPRING_GLIDE = { stiffness: 700, damping: 50, mass: 0.5 } as const;

const SPRING_BOUNCY = {
  type: "spring",
  stiffness: 500,
  damping: 14,
  mass: 0.7,
} as const;

export interface RangeSliderProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showTicks?: boolean;
  disabled?: boolean;
  /** Rend la piste et la poignée en sourdine tant qu'aucune valeur n'a été
   *  saisie — l'app distingue « 0 » de « pas encore renseigné ». */
  unset?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-valuetext"?: string;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function RangeSlider({
  value,
  defaultValue = 0,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  showTicks = true,
  disabled = false,
  unset = false,
  className,
  "aria-label": ariaLabel,
  "aria-valuetext": ariaValueText,
}: RangeSliderProps) {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [internal, setInternal] = useState(defaultValue);
  const [active, setActive] = useState(false);

  const controlled = value !== undefined;
  const current = clamp(controlled ? value : internal, min, max);
  const percent = ((current - min) / (max - min)) * 100;

  const target = useMotionValue(percent);

  useEffect(() => {
    target.set(percent);
  }, [percent, target]);

  const smooth = useSpring(target, SPRING_GLIDE);
  const pos = reduce ? target : smooth;
  const left = useMotionTemplate`${pos}%`;
  const thumbX = useTransform(pos, (p) => `${-p}%`);

  const steps = Math.floor((max - min) / step);
  const ticks =
    showTicks && steps > 0 && steps <= 50
      ? Array.from({ length: steps + 1 }, (_, i) => min + i * step)
      : [];

  const commit = useCallback(
    (next: number) => {
      const snapped = clamp(Math.round((next - min) / step) * step + min, min, max);
      if (!controlled) setInternal(snapped);
      onValueChange?.(snapped);
    },
    [controlled, onValueChange, min, max, step]
  );

  const valueFromX = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return current;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return min + ratio * (max - min);
    },
    [current, min, max]
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setActive(true);
      commit(valueFromX(event.clientX));
    },
    [disabled, commit, valueFromX]
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!active || disabled) return;
      commit(valueFromX(event.clientX));
    },
    [active, disabled, commit, valueFromX]
  );

  const endDrag = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setActive(false);
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const map: Record<string, number> = {
        ArrowRight: current + step,
        ArrowUp: current + step,
        ArrowLeft: current - step,
        ArrowDown: current - step,
        Home: min,
        End: max,
      };
      if (event.key in map) {
        event.preventDefault();
        commit(map[event.key]);
      }
    },
    [disabled, current, step, min, max, commit]
  );

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        "relative flex h-12 w-full touch-none select-none items-center overflow-hidden rounded-2xl bg-surface",
        disabled
          ? "pointer-events-none opacity-50"
          : "cursor-grab active:cursor-grabbing",
        className
      )}
    >
      <motion.div
        className={cn(
          "absolute inset-y-0 left-0 transition-colors",
          unset ? "bg-surface-2" : "bg-accent/25"
        )}
        style={{ width: left }}
      />

      {/* Retrait de 3 px = la moitié de la largeur de poignée. La poignée est
          positionnée à `left: p%` puis translatée de `-p%` d'elle-même : son
          centre tombe donc à `3px + p% × (largeur − 6px)`. Les repères doivent
          suivre exactement cette géométrie, sinon ils dérivent — jusqu'à 9 px
          d'écart à 10/10 avec le retrait de 12 px de l'original. */}
      <div className="pointer-events-none absolute inset-x-[3px] inset-y-0">
        {ticks.map((t) => {
          const tp = ((t - min) / (max - min)) * 100;
          return (
            <span
              key={t}
              className="absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted/35"
              style={{ left: `${tp}%` }}
            />
          );
        })}
      </div>

      <motion.div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={ariaValueText}
        aria-disabled={disabled || undefined}
        onKeyDown={onKeyDown}
        animate={reduce ? undefined : { scaleY: active ? 1.3 : 1 }}
        transition={SPRING_BOUNCY}
        className={cn(
          "absolute top-1/2 h-7 w-[6px] rounded-full outline-none ring-accent/40 focus-visible:ring-4",
          unset ? "bg-muted/60" : "bg-accent"
        )}
        style={{ left, x: thumbX, y: "-50%" }}
      />
    </div>
  );
}
