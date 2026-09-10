/**
 * Une liste d'amorce, pour les jours où le carnet n'a encore rien à
 * proposer.
 *
 * Les habitudes (`fetchHabits`) sont tirées de ce qui a déjà été noté : sur
 * un compte neuf, elles sont vides, et le champ des repas est nu le soir où
 * on a le moins envie de taper. Cette liste comble ce démarrage à froid, et
 * sert ensuite d'aide-mémoire — « ah oui, du café ».
 *
 * Trois partis pris :
 *
 * 1. **Elle recule au fur et à mesure.** Plus le carnet connaît d'habitudes,
 *    moins il en propose d'ici (voir `commonSuggestions`). Au bout de deux
 *    semaines, ce qui s'affiche vient presque entièrement de la personne.
 * 2. **Elle est courte et ordinaire.** Des aliments courants d'un repas
 *    français, pas une nomenclature. Ce n'est pas une liste de déclencheurs :
 *    l'app note ce qui a été mangé, elle ne dit pas ce qui est bon ou mauvais
 *    — ce serait un avis médical qu'elle n'a pas à donner.
 * 3. **L'ordre est fixe**, comme celui des habitudes : une liste qui bouge
 *    d'une ouverture à l'autre ne se vise plus de mémoire.
 *
 * Rien n'y est enfermé : le champ reste libre, et tout ce qu'on y tape
 * devient une habitude au bout de quelques journées.
 */
export const COMMON_FOODS = [
  "pain",
  "riz",
  "pâtes",
  "pommes de terre",
  "œufs",
  "poulet",
  "poisson",
  "viande rouge",
  "légumes",
  "salade",
  "fruits",
  "soupe",
  "fromage",
  "yaourt",
  "lait",
  "chocolat",
  "café",
  "thé",
  "alcool",
] as const;

/**
 * Comparaison souple : « Riz » et « riz » sont le même aliment, « thé » et
 * « the » aussi. Le champ est libre, la casse et les accents y varient d'un
 * soir à l'autre — sans ça, la liste reproposait ce qui était déjà choisi.
 */
export function normaliseFood(food: string): string {
  return food
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Retire de `list` tout ce qui figure déjà dans `already`. */
export function withoutFoods(list: readonly string[], already: readonly string[]): string[] {
  const seen = new Set(already.map(normaliseFood));
  return list.filter((food) => !seen.has(normaliseFood(food)));
}

/**
 * Ce qu'on propose depuis la liste d'amorce.
 *
 * Le total affiché reste autour de dix mots : la place cédée aux habitudes
 * est reprise ici, jamais ajoutée. Un plancher de cinq garde une amorce
 * visible même pour quelqu'un qui a déjà six habitudes bien installées —
 * c'est là que l'aide-mémoire sert, pour l'aliment qu'on ne mange qu'une
 * fois par mois.
 */
export function commonSuggestions(habits: readonly string[], chosen: readonly string[]): string[] {
  const max = Math.max(5, 10 - habits.length);
  return withoutFoods(COMMON_FOODS, [...habits, ...chosen]).slice(0, max);
}
