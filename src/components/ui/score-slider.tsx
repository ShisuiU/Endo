"use client";

import { RangeSlider } from "@/components/ui/be-ui-range-slider";
import { cn } from "@/lib/cn";

/**
 * Note de 0 à 10 (douleur, sommeil, humeur, énergie, intensité de crise).
 *
 * S'appuie sur `RangeSlider` : on glisse la poignée, ou on appuie
 * directement au bon endroit de la piste — les deux gestes fonctionnent,
 * et le second est celui qui compte quand on n'a pas la main sûre.
 *
 * Une note peut être **non renseignée**, ce que ne prévoit pas une
 * réglette (elle a toujours une position). On distingue donc les deux :
 * tant que rien n'est saisi, la valeur affiche « – », la poignée reste en
 * sourdine à gauche, et `aria-valuetext` l'annonce explicitement aux
 * lecteurs d'écran plutôt que de laisser croire à un zéro.
 */
export function ScoreSlider({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
}) {
  const unset = value === null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-center gap-2 text-foreground">
          {icon}
          <span className="text-[0.95rem]">{label}</span>
        </div>
        <span
          className={cn(
            "font-display italic text-[1.75rem] leading-none tabular transition-colors",
            unset ? "text-muted/50" : "text-accent"
          )}
        >
          {value ?? "–"}
        </span>
      </div>

      <RangeSlider
        value={value ?? 0}
        onValueChange={onChange}
        min={0}
        max={10}
        step={1}
        unset={unset}
        aria-label={label}
        aria-valuetext={unset ? "non renseigné" : `${value} sur 10`}
      />
    </div>
  );
}
