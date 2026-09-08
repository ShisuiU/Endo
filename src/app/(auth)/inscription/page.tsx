import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="font-display italic text-[1.9rem] leading-snug mb-3">Ton carnet, pour toi</h1>
      <p className="text-[0.95rem] text-muted leading-relaxed mb-8 max-w-[26ch]">
        Privé par défaut. Personne d&apos;autre n&apos;y a accès.
      </p>
      <SignupForm />
      <p className="text-[0.9rem] text-muted mt-8">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-foreground underline underline-offset-4">
          Connecte-toi
        </Link>
      </p>
    </div>
  );
}
