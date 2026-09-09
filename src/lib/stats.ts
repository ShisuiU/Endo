import { daysBetween } from "@/lib/date";

export type CrisisStats = {
  /** Nombre d'**épisodes**, pas de jours de crise. */
  count: number;
  /** Longueur de chaque épisode en jours, du plus ancien au plus récent. */
  lengths: number[];
  intervals: number[]; // en jours, du plus ancien au plus récent
  averageInterval: number | null;
  lastInterval: number | null;
  estimateLabel: string | null;
};

/**
 * Regroupe les jours de crise en **épisodes**.
 *
 * Une crise d'endométriose dure rarement une seule journée : trois jours
 * consécutifs, c'est une crise, pas trois. Compter chaque jour séparément
 * faisait entrer des intervalles d'un jour dans la moyenne et l'écrasait —
 * sur deux mois de données réelles, « 6 jours entre deux crises » au lieu
 * d'environ 28. Un épisode s'arrête dès qu'une journée sans crise le coupe.
 */
export function groupEpisodes(sortedDates: string[]): string[][] {
  const episodes: string[][] = [];
  for (const date of sortedDates) {
    const current = episodes[episodes.length - 1];
    if (current && daysBetween(current[current.length - 1], date) === 1) current.push(date);
    else episodes.push([date]);
  }
  return episodes;
}

/**
 * À partir des dates (triées) où une crise a été déclarée, calcule
 * l'intervalle moyen entre deux crises — l'estimation demandée pour situer
 * la prochaine échéance probable.
 *
 * Les intervalles se mesurent **d'un début d'épisode au suivant** : c'est le
 * rythme qu'on cherche à voir, pas la durée des accalmies.
 */
export function computeCrisisStats(sortedDates: string[]): CrisisStats {
  const episodes = groupEpisodes(sortedDates);
  const starts = episodes.map((days) => days[0]);

  const intervals: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    intervals.push(daysBetween(starts[i - 1], starts[i]));
  }

  const averageInterval =
    intervals.length > 0
      ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
      : null;
  const lastInterval = intervals.length > 0 ? intervals[intervals.length - 1] : null;

  let estimateLabel: string | null = null;
  if (averageInterval !== null && starts.length > 0) {
    // On repart du **dernier jour** du dernier épisode : tant qu'il dure, la
    // prochaine crise n'a évidemment pas commencé.
    const lastEpisode = episodes[episodes.length - 1];
    const daysSince = daysBetween(
      lastEpisode[lastEpisode.length - 1],
      new Date().toISOString().slice(0, 10)
    );
    const sinceStart = daysBetween(starts[starts.length - 1], new Date().toISOString().slice(0, 10));
    const remaining = averageInterval - sinceStart;
    estimateLabel =
      daysSince === 0
        ? "Crise en cours"
        : remaining > 0
          ? `Dans ~${remaining} jour${remaining > 1 ? "s" : ""}, à ce rythme`
          : "Déjà dépassé l'intervalle habituel";
  }

  return {
    count: episodes.length,
    lengths: episodes.map((days) => days.length),
    intervals,
    averageInterval,
    lastInterval,
    estimateLabel,
  };
}
