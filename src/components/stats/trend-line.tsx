"use client";

/**
 * Courbe de tendance dessinée à la main (pas de librairie de charts) :
 * une ligne fine, un point d'accent sur la dernière valeur connue, et un
 * remplissage très léger. Les valeurs manquantes créent un trou dans le
 * tracé plutôt que d'être interpolées.
 */
export function TrendLine({
  label,
  values,
  max = 10,
}: {
  label: string;
  values: (number | null)[];
  max?: number;
}) {
  const width = 300;
  const height = 64;
  const padY = 8;
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values.map((v, i) => {
    if (v === null) return null;
    const x = i * step;
    const y = padY + (1 - v / max) * (height - padY * 2);
    return { x, y };
  });

  const segments: string[] = [];
  let current: string | null = null;
  points.forEach((p) => {
    if (!p) {
      current = null;
      return;
    }
    if (current === null) {
      current = `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      segments.push(current);
    } else {
      segments[segments.length - 1] += ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }
  });

  const lastPoint = [...points].reverse().find((p) => p !== null) ?? null;
  const lastValue = [...values].reverse().find((v) => v !== null) ?? null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-display italic text-lg text-accent tabular">
          {lastValue ?? "–"}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16" preserveAspectRatio="none">
        <line
          x1={0}
          y1={height - padY}
          x2={width}
          y2={height - padY}
          stroke="var(--hairline)"
          strokeWidth={1}
        />
        {segments.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--color-rosewood)" strokeWidth={1.5} />
        ))}
        {lastPoint && (
          <circle cx={lastPoint.x} cy={lastPoint.y} r={2.5} fill="var(--color-rosewood)" />
        )}
      </svg>
    </div>
  );
}
