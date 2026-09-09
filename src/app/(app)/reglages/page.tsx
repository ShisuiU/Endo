import type { Metadata } from "next";
import { signOut } from "../../(auth)/actions";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = { title: "Réglages" };

export default function SettingsPage() {
  // La déconnexion reste une Server Action : c'est le serveur qui doit
  // effacer les cookies de session, pas le navigateur.
  async function handleSignOut() {
    "use server";
    await signOut();
  }

  return <SettingsView onSignOut={handleSignOut} />;
}
