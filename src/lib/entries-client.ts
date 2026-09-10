import { createClient } from "@/lib/supabase/client";
import type { DailyEntry, DailyEntryInput } from "@/lib/supabase/types";

/**
 * Identifiant du compte connecté. Sert à cloisonner ce qui est mis de côté
 * en local (voir `pending-entries.ts`) : le stockage du navigateur est
 * partagé, les comptes ne le sont pas.
 */
export async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function fetchEntry(entryDate: string): Promise<DailyEntry | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("entry_date", entryDate)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchEntriesInRange(
  startDate: string,
  endDate: string
): Promise<DailyEntry[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("entry_date", startDate)
    .lte("entry_date", endDate)
    .order("entry_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchAllCrisisDates(): Promise<string[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("daily_entries")
    .select("entry_date")
    .eq("user_id", user.id)
    .eq("had_crisis", true)
    .order("entry_date", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => row.entry_date);
}

/** Toutes les journées, de la plus ancienne à la plus récente — pour l'export. */
export async function fetchAllEntries(): Promise<DailyEntry[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Supprime une journée. Le filtre sur `user_id` double la RLS : même si une
 *  policy venait à changer, la requête ne peut viser que ses propres lignes. */
export async function deleteEntry(entryDate: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  const { error } = await supabase
    .from("daily_entries")
    .delete()
    .eq("user_id", user.id)
    .eq("entry_date", entryDate);

  if (error) throw error;
}

/** Vide le carnet. Irréversible — l'appelant doit avoir fait confirmer. */
export async function deleteAllEntries(): Promise<number> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  const { data, error } = await supabase
    .from("daily_entries")
    .delete()
    .eq("user_id", user.id)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

export async function upsertEntry(input: DailyEntryInput): Promise<DailyEntry> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  const { data, error } = await supabase
    .from("daily_entries")
    .upsert({ ...input, user_id: user.id }, { onConflict: "user_id,entry_date" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Ce qui revient souvent, pour ne pas le retaper chaque soir.
 *
 * Le carnet se remplit en douleur, au lit, au pouce : « riz », « poulet »,
 * « Spasfon, 2 comprimés » sont retapés à l'identique des dizaines de fois.
 * Une seule requête sur les 90 derniers jours en tire deux choses — les
 * aliments les plus notés, et le dernier médicament écrit.
 *
 * Volontairement limité aux 90 derniers jours : ce sont des *habitudes*
 * actuelles, pas un historique. Un aliment abandonné depuis six mois n'a
 * rien à faire sous le champ. Six mots au plus : au-delà, la phrase passe à
 * deux lignes et chaque mot se noie dans la liste.
 */
export type Habits = { foods: string[]; medication: string | null };

export async function fetchHabits(days = 90, limit = 6): Promise<Habits> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { foods: [], medication: null };

  const since = new Date();
  since.setDate(since.getDate() - days);
  const iso = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(
    since.getDate()
  ).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("daily_entries")
    .select("entry_date, foods, medication_notes")
    .eq("user_id", user.id)
    .gte("entry_date", iso)
    .order("entry_date", { ascending: false });

  if (error) throw error;

  const counts = new Map<string, number>();
  let medication: string | null = null;
  for (const row of data ?? []) {
    for (const food of row.foods ?? []) {
      const clean = food.trim();
      if (clean) counts.set(clean, (counts.get(clean) ?? 0) + 1);
    }
    // Les lignes arrivent de la plus récente à la plus ancienne : le
    // premier médicament écrit qu'on croise est le dernier pris.
    if (medication === null && row.medication_notes?.trim()) {
      medication = row.medication_notes.trim();
    }
  }

  const foods = [...counts.entries()]
    // À égalité de fréquence, l'ordre alphabétique : sans ce départage, la
    // liste changeait d'ordre d'une ouverture à l'autre et on ne pouvait
    // plus viser de mémoire.
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .slice(0, limit)
    .map(([food]) => food);

  return { foods, medication };
}
