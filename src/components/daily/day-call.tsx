"use client";

import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * L'appel à noter la journée — le premier élément de l'accueil.
 *
 * Une session de cette app, c'est très souvent *ça et rien d'autre* :
 * on ouvre, on remplit, on referme. Le reste (relire, le calendrier, les
 * repères) vient après. L'appel occupe donc le haut de l'écran et porte le
 * seul mouvement de la page — un halo corail qui respire lentement derrière
 * le bouton, tant que la journée n'a pas été touchée. Une fois qu'elle est
 * notée, le halo s'éteint : il n'y a plus rien à réclamer, et l'accueil
 * redevient un écran de lecture.
 *
 * Le halo est `pointer-events-none` et purement décoratif ; il n'anime que
 * l'opacité et l'échelle, et `prefers-reduced-motion` le fige (règle globale
 * de `globals.css`).
 */
export function DayCall({
  headline,
  detail,
  action,
  glow,
  onStart,
}: {
  headline: string;
  detail: string;
  action: string;
  /** Le halo ne respire que tant qu'il reste quelque chose à noter. */
  glow: boolean;
  onStart: () => void;
}) {
  return (
    <section className="relative pt-8 pb-9">
      {glow && (
        <div
          aria-hidden
          // ⚠️ `inset-x-0`, pas de valeur négative : débordant de 40 px de
          // chaque côté, ce halo ajoutait 7 px de défilement horizontal à la
          // page sur un écran de 390 px — invisible à l'œil, mais la page
          // partait de travers au doigt. Le dégradé est élargi pour compenser.
          className="breathe pointer-events-none absolute inset-x-0 top-0 -z-10 h-64"
          style={{
            background:
              "radial-gradient(72% 58% at 50% 55%, color-mix(in srgb, var(--color-coral) 26%, transparent), transparent 76%)",
          }}
        />
      )}

      <h2 className="font-display text-[2.1rem] leading-[1.12] tracking-[-0.02em]">{headline}</h2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-muted">{detail}</p>

      <button
        type="button"
        onClick={onStart}
        className={cn(
          // 64 px : c'est le geste principal de l'app, il doit se viser sans
          // regarder — au-dessus des 56 px de la navigation.
          "group mt-6 flex min-h-[64px] w-full items-center justify-between gap-4 rounded-full px-7",
          "bg-accent text-ground text-[1rem] font-medium tracking-[0.01em]",
          "transition-opacity hover:opacity-90"
        )}
      >
        {action}
        <ArrowRightIcon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-1" />
      </button>
    </section>
  );
}
