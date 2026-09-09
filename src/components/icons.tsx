import type { SVGProps } from "react";

/**
 * Set d'icônes maison, dessinées pour "endo" — trait fin unique (1.5),
 * légèrement irrégulier plutôt que géométriquement parfait, pour éviter
 * l'effet "set d'icônes de librairie" (Heroicons/Lucide non retouchés).
 * Toutes héritent de currentColor.
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15.5 3.2c-4.9.9-8 5-7.4 9.9.6 4.6 4.9 7.9 9.5 7.4-2.7 2-6.4 2.6-9.8 1C3.2 19.4.9 14.6 2.5 9.8 3.9 5.6 8 2.8 12.4 3c1.1.1 2.1.3 3.1.2Z" />
    </svg>
  );
}

export function DropletIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.5c2.6 3.4 6 8 6 11.4a6 6 0 1 1-12 0c0-3.4 3.4-8 6-11.4Z" />
      <path d="M9.5 15.2c0 1.3 1 2.4 2.3 2.5" opacity={0.6} />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  // crise / poussée — un éclat asymétrique plutôt qu'un zap générique
  return (
    <svg {...base} {...props}>
      <path d="M12.6 2.6 9.3 13h3.4l-1 8.4 6.9-11.7h-3.7l1.7-7.1Z" strokeLinejoin="round" />
    </svg>
  );
}

export function PillIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.2" y="9.4" width="17.6" height="7.2" rx="3.6" transform="rotate(-32 12 13)" />
      <path d="M11 9.2 14.7 15" transform="rotate(-32 12 13)" opacity={0.6} />
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19.5 4.7c.6 6.7-1.5 11-6.8 13.9-3.7 2-7.3.6-8-2.8C3.9 12 6.7 8 12 6.1c2.4-.9 5-1.2 7.5-1.4Z" />
      <path d="M6.5 20c1.6-4.3 4-7.4 7.8-9.7" opacity={0.6} />
    </svg>
  );
}

/**
 * Trio de la navigation basse. Dessiné pour ces trois écrans précis plutôt
 * que pris dans un set : le carnet du jour, l'anneau du calendrier (le même
 * cadran que `MonthRing`), et la courbe des repères.
 */
export function JournalIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.6" y="3.4" width="14.8" height="17.2" rx="2.4" />
      <path d="M8.3 3.6v16.8" opacity={0.45} />
      <path d="M11.4 8.6h4.7M11.4 12.1h4.7M11.4 15.6h2.9" />
    </svg>
  );
}

export function RingIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      {/* Anneau pointillé : les jours du mois posés en cercle, comme le
          cadran de l'écran Calendrier. Un anneau à rayons se lirait comme
          un soleil à cette taille — les tirets, non. */}
      <circle cx="12" cy="12" r="7.6" strokeDasharray="1.5 2.5" />
      <circle cx="17.4" cy="6.6" r="1.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TrendIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.4 16.9c2.7-.5 4-5 6.4-5.3 2.4-.3 3 3.4 4.9 2.9 1.9-.5 2.7-4.9 4.2-6.7" />
      <circle cx="14.7" cy="14.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5.2" width="17" height="15.3" rx="2.2" />
      <path d="M3.5 9.6h17" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 19V9.5M9.5 19V5M15 19v-6.5M20 19V11" />
      <path d="M3.5 19.5h17" opacity={0.5} />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.2 12h15.1" />
      <path d="M13.6 6.1 19.4 12l-5.8 5.9" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 5 8 12l6.5 7" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 5 16 12l-6.5 7" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.5v15M4.5 12h15" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12.5 9.2 17 19.5 6" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.5h9.2L19 7.3V20a.7.7 0 0 1-.7.7H6a.7.7 0 0 1-.7-.7V4.2A.7.7 0 0 1 6 3.5Z" />
      <path d="M9 9.2h6M9 12.6h6M9 16h4" opacity={0.6} />
    </svg>
  );
}

/** Deux réglettes décalées — l'app est faite de réglettes, l'icône aussi.
 *  Une roue dentée aurait été le réflexe, et le réflexe est générique. */
export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.4 8.6h17.2M3.4 15.4h17.2" />
      <circle cx="9.1" cy="8.6" r="2.3" fill="var(--color-ground)" />
      <circle cx="15.4" cy="15.4" r="2.3" fill="var(--color-ground)" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.6v11.2" />
      <path d="M7.6 10.6 12 15l4.4-4.4" />
      <path d="M4.2 18.4c2.4.9 5 1.3 7.8 1.3s5.4-.4 7.8-1.3" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.4 6.6h15.2" />
      <path d="M9.4 6.4V4.7c0-.7.6-1.2 1.3-1.2h2.6c.7 0 1.3.5 1.3 1.2v1.7" />
      <path d="M6.4 6.6l.9 12.1c.1 1 .9 1.8 1.9 1.8h5.6c1 0 1.8-.8 1.9-1.8l.9-12.1" />
      <path d="M10.4 10.2v6.4M13.6 10.2v6.4" opacity={0.5} />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h3.5" />
      <path d="M14 8l4 4-4 4M18 12H9" />
    </svg>
  );
}
