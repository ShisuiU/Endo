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
