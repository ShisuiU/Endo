import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Champ de saisie à libellé montant.
 *
 * Idée reprise d'un motif repéré dans le catalogue 21st ("floating label"),
 * mais réécrite à la main et sur un point précis : le libellé monte dans un
 * emplacement **réservé** au-dessus du champ au lieu de disparaître. Deux
 * conséquences qui comptent — le libellé reste lisible une fois le champ
 * rempli (le placeholder seul est un anti-pattern d'accessibilité), et la
 * hauteur ne bouge jamais, donc aucun décalage de mise en page.
 *
 * Tout passe par `:placeholder-shown` en CSS, sans état React : le
 * remplissage automatique du navigateur est correctement pris en compte,
 * ce qui n'est pas le cas des implémentations pilotées par onChange.
 */
export function Field({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();

  return (
    <div>
      <div className="relative hairline rounded-2xl bg-surface transition-colors focus-within:border-accent/70">
        <input
          id={id}
          // Espace insécable : le champ est toujours "placeholder-shown"
          // tant qu'il est vide, ce qui pilote la position du libellé.
          placeholder=" "
          className={cn(
            "peer w-full min-h-[64px] bg-transparent px-4 pt-7 pb-2.5 text-[0.95rem] outline-none",
            className
          )}
          {...props}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-2.5 text-[0.62rem] uppercase tracking-[0.2em] text-muted transition-all duration-200
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[0.95rem] peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-muted/70
            peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[0.62rem] peer-focus:uppercase peer-focus:tracking-[0.2em] peer-focus:text-accent"
        >
          {label}
        </label>
      </div>
      {hint && <p className="mt-2 text-[0.78rem] text-muted/80">{hint}</p>}
    </div>
  );
}
