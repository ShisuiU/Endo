import { daysBetween } from "@/lib/date";

export type CrisisStats = {
  count: number;
  intervals: number[]; // en jours, du plus ancien au plus récent
  averageInterval: number | null;
  lastInterval: number | null;
  estimateLabel: string | null;
};

/** À partir des dates (triées) où une crise a été déclarée, calcule
 * l'intervalle moyen entre deux crises — l'estimation demandée pour situer
 * la prochaine échéance probable. */
export function computeCrisisStats(sortedDates: string[]): CrisisStats {
  const intervals: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    intervals.push(daysBetween(sortedDates[i - 1], sortedDates[i]));
  }

  const averageInterval =
    intervals.length > 0
      ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
      : null;
  const lastInterval = intervals.length > 0 ? intervals[intervals.length - 1] : null;

  let estimateLabel: string | null = null;
  if (averageInterval !== null && sortedDates.length > 0) {
    const last = sortedDates[sortedDates.length - 1];
    const daysSince = daysBetween(last, new Date().toISOString().slice(0, 10));
    const remaining = averageInterval - daysSince;
    estimateLabel =
      remaining > 0
        ? `Dans ~${remaining} jour${remaining > 1 ? "s" : ""}, à ce rythme`
        : "Déjà dépassé l'intervalle habituel";
  }

  return {
    count: sortedDates.length,
    intervals,
    averageInterval,
    lastInterval,
    estimateLabel,
  };
}
