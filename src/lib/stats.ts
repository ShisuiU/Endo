import { daysBetween } from "@/lib/date";

export type CrisisStats = {
  /** Nombre d'**épisodes**, pas de jours de crise. */
  count: number;
  /** Longueur de chaque épisode en jours, du plus ancien au plus récent. */
  lengths: number[];
  intervals: number[]; // en jours, du plus ancien au plus récent
  averageInterval: number | null;
  lastInterval: number | null;
  /** Bornes des intervalles observés — une moyenne seule ment quand l'écart
   *  est large (6 et 29 jours donnent « 14 », qui n'est jamais arrivé). */
  minInterval: number | null;
  maxInterval: number | null;
  /** Durée moyenne d'un épisode, arrondie. */
  averageLength: number | null;
  /** Faux quand les intervalles sont trop dispersés pour qu'une estimation
   *  ait un sens. Aucune prédiction n'est alors affichée. */
  regular: boolean;
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
  const minInterval = intervals.length > 0 ? Math.min(...intervals) : null;
  const maxInterval = intervals.length > 0 ? Math.max(...intervals) : null;
  const averageLength =
    episodes.length > 0
      ? Math.round(episodes.reduce((a, e) => a + e.length, 0) / episodes.length)
      : null;

  // Un seul intervalle ne dit rien de la régularité ; au-delà, on compare
  // l'étendue à la moyenne. Étalé sur plus que sa propre moyenne, le rythme
  // n'en est pas un — mieux vaut le dire que produire une fausse échéance.
  const regular =
    intervals.length >= 2 &&
    averageInterval !== null &&
    maxInterval !== null &&
    minInterval !== null &&
    maxInterval - minInterval <= averageInterval;

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
        : !regular && intervals.length >= 2
          ? "Trop irrégulier pour une estimation"
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
    minInterval,
    maxInterval,
    averageLength,
    regular,
    estimateLabel,
  };
}
