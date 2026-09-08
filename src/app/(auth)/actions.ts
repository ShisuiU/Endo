"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null; info?: string | null };

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  redirect("/aujourdhui");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName || null } },
  });

  if (error) {
    return { error: "Impossible de créer le compte. Cet email est peut-être déjà utilisé." };
  }

  if (!data.session) {
    // Confirmation email activée côté projet Supabase : pas de session tant
    // que le lien n'est pas cliqué.
    return {
      error: null,
      info: "Compte créé — vérifie ta boîte mail pour confirmer ton adresse avant de te connecter.",
    };
  }

  redirect("/aujourdhui");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
