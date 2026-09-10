"use client";

import Link from "next/link";
import { NAV_ITEMS, useActiveHref } from "@/components/app-shell/nav-items";
import { cn } from "@/lib/cn";

/**
 * La navigation de l'écran large, posée dans l'en-tête.
 *
 * La capsule du bas est faite pour le pouce ; en haut d'une fenêtre de
 * bureau, avec une souris, elle n'a plus de sens — et une pastille glissante
 * dans un en-tête ferait décoration. Ici, trois mots et un filet corail sous
 * celui où l'on est : l'idiome éditorial du reste de l'app.
 *
 * Elle et la capsule ne sont jamais visibles en même temps (`hidden md:flex`
 * d'un côté, `md:hidden` de l'autre), mais **toutes deux montées** : c'est
 * pourquoi celle-ci n'utilise pas `layoutId` — deux pastilles partageant le
 * même identifiant se disputeraient l'animation.
 */
export function HeaderNav() {
  const { active, onTap } = useActiveHref();

  return (
    <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-7">
      {NAV_ITEMS.map(({ href, label }) => {
        const on = active === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            onClick={() => onTap(href)}
            className={cn(
              "relative flex min-h-[44px] items-center text-[0.9rem] transition-colors",
              on ? "text-accent" : "text-muted hover:text-foreground"
            )}
          >
            {label}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-1 h-px transition-colors",
                on ? "bg-accent" : "bg-transparent"
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
