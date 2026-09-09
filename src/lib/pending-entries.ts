import type { DailyEntryInput } from "@/lib/supabase/types";
import { upsertEntry } from "@/lib/entries-client";

/**
 * File d'attente locale des journées qu'on n'a pas réussi à envoyer.
 *
 * Le carnet se remplit le soir, souvent au lit, parfois sans réseau. Sans
 * ce filet, un échec d'envoi effaçait la journée en silence : l'app
 * affichait « Enregistré », rien n'était parti, et la saisie disparaissait
 * au rechargement. C'est la panne la plus grave possible ici — on note une
 * douleur une fois, on ne la retrouve pas après coup.
 *
 * La clé porte l'identifiant du compte : deux personnes peuvent partager un
 * téléphone, et une journée en attente ne doit jamais être poussée dans le
 * compte de l'autre.
 *
 * Tous les accès sont enveloppés : Safari en navigation privée lève sur
 * `localStorage`, et un carnet qui plante vaut moins qu'un carnet qui perd
 * son filet.
 */

const PREFIX = "endo:pending:";

export type PendingEntry = {
  payload: DailyEntryInput;
  /** Horodatage local du dernier échec, pour l'afficher à l'utilisatrice. */
  failedAt: number;
};

function key(userId: string, date: string) {
  return `${PREFIX}${userId}:${date}`;
}

export function writePending(userId: string, date: string, payload: DailyEntryInput) {
  try {
    const record: PendingEntry = { payload, failedAt: Date.now() };
    window.localStorage.setItem(key(userId, date), JSON.stringify(record));
  } catch {
    // Quota plein ou stockage refusé : on ne peut rien de plus que garder
    // la saisie en mémoire, ce que fait déjà l'état React du formulaire.
  }
}

export function readPending(userId: string, date: string): PendingEntry | null {
  try {
    const raw = window.localStorage.getItem(key(userId, date));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingEntry;
    return parsed?.payload?.entry_date === date ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPending(userId: string, date: string) {
  try {
    window.localStorage.removeItem(key(userId, date));
  } catch {
    /* rien à faire */
  }
}

export function listPendingDates(userId: string): string[] {
  const dates: string[] = [];
  try {
    const prefix = `${PREFIX}${userId}:`;
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(prefix)) dates.push(k.slice(prefix.length));
    }
  } catch {
    return [];
  }
  return dates.sort();
}

/**
 * Journées ouvertes dans un formulaire monté. Le formulaire gère lui-même
 * ses propres tentatives ; la synchro d'arrière-plan les laisse tranquilles
 * pour que deux envois de la même journée ne se croisent pas.
 */
const claimed = new Set<string>();

export function claimDate(date: string) {
  claimed.add(date);
}

export function releaseDate(date: string) {
  claimed.delete(date);
}

/**
 * Rejoue les journées en attente. Renvoie le nombre de journées effectivement
 * remontées ; s'arrête à la première erreur réseau, inutile de marteler.
 */
export async function flushPending(userId: string): Promise<number> {
  let sent = 0;
  for (const date of listPendingDates(userId)) {
    if (claimed.has(date)) continue;
    const pending = readPending(userId, date);
    if (!pending) continue;
    try {
      await upsertEntry(pending.payload);
      clearPending(userId, date);
      sent += 1;
    } catch {
      break;
    }
  }
  return sent;
}
