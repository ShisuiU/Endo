import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

/**
 * Le profil léger, créé à l'inscription par le trigger `handle_new_user`.
 * Le prénom y était déposé depuis le formulaire d'inscription mais n'était
 * jusqu'ici jamais relu — les réglages le rendent visible et modifiable.
 */
export async function fetchProfile(): Promise<{ profile: Profile | null; email: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { profile: null, email: null };

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return { profile: data, email: user.email ?? null };
}

export async function updateDisplayName(displayName: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null })
    .eq("id", user.id);

  if (error) throw error;
}
