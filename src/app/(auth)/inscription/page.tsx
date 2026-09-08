import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="font-display italic text-2xl text-center mb-1">Ton carnet, pour toi</h1>
      <p className="text-center text-sm text-muted mb-8">
        Privé par défaut. Personne d&apos;autre n&apos;y a accès.
      </p>
      <SignupForm />
      <p className="text-center text-sm text-muted mt-8">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-foreground underline underline-offset-4">
          Connecte-toi
        </Link>
      </p>
    </div>
  );
}
