/**
 * Écran d'attente des trois onglets.
 *
 * Il ne sert pas à décorer : sans lui, Next.js ne peut rien précharger d'une
 * route dynamique, et un appui sur la navigation laissait l'écran précédent
 * figé le temps de l'aller-retour serveur (400 à 900 ms, mesuré en
 * production). Avec cette frontière, la coquille est préchargée dès que la
 * barre est à l'écran et s'affiche à l'appui, le contenu arrive derrière.
 *
 * Il reprend donc le rythme réel des écrans — filets fins, mêmes marges —
 * plutôt qu'un gabarit générique : la transition doit passer inaperçue.
 */
export default function Loading() {
  return (
    <div className="flex-1 flex flex-col px-6 pb-12" aria-hidden>
      <div className="pt-7 pb-6 hairline-b">
        <div className="h-14 w-52 rounded-2xl bg-surface" />
        <div className="mt-5 h-3 w-24 rounded-full bg-surface" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="py-7 hairline-b">
          <div className="h-3 w-20 rounded-full bg-surface" />
          <div className="mt-5 h-12 w-full rounded-2xl bg-surface" />
        </div>
      ))}
      <span className="sr-only" aria-hidden={false} role="status">
        Chargement…
      </span>
    </div>
  );
}
