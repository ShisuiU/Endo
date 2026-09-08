"use client";

import { useId } from "react";

/**
 * Courbe de tendance dessinée à la main — aucune librairie de charts.
 * Les valeurs manquantes créent un trou dans le tracé plutôt que d'être
 * interpolées : un jour non renseigné n'est pas un zéro, et prétendre le
 * contraire fausserait la lecture.
 */
export function TrendLine({
  label,
  values,
  max = 10,
  tone = "coral",
}: {
  label: string;
  values: (number | null)[];
  max?: number;
  tone?: "coral" | "sage";
}) {
  const titleId = useId();
  const width = 320;
  const height = 76;
  const pad = 8;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const stroke = tone === "sage" ? "var(--color-sage)" : "var(--color-coral)";

  const points = values.map((v, i) =>
    v === null ? null : { x: i * step, y: pad + (1 - v / max) * (height - pad * 2) }
  );

  const segments: string[] = [];
  let open = false;
  for (const p of points) {
    if (!p) {
      open = false;
      continue;
    }
    if (!open) {
      segments.push(`M${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      open = true;
    } else {
      segments[segments.length - 1] += ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }
  }

  const last = [...points].reverse().find((p) => p !== null) ?? null;
  const lastValue = [...values].reverse().find((v) => v !== null) ?? null;
  const known = values.filter((v) => v !== null).length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[0.95rem] text-foreground">{label}</span>
        <span
          className="font-display italic text-[1.4rem] tabular"
          style={{ color: stroke }}
        >
          {lastValue ?? "–"}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[76px]"
        preserveAspectRatio="none"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          {known === 0
            ? `${label} : aucune donnée sur la période`
            : `${label} : dernière valeur ${lastValue} sur ${max}, ${known} jours renseignés`}
        </title>
        <line
          x1={0}
          y1={height - pad}
          x2={width}
          y2={height - pad}
          stroke="var(--hairline)"
          strokeWidth={1}
        />
        {segments.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {last && <circle cx={last.x} cy={last.y} r={3} fill={stroke} />}
      </svg>
    </div>
  );
}
