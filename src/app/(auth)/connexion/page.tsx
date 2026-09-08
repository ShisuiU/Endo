import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-display italic text-2xl text-center mb-1">Bon retour</h1>
      <p className="text-center text-sm text-muted mb-8">
        Ton carnet reprend là où tu l&apos;as laissé.
      </p>
      <LoginForm />
      <p className="text-center text-sm text-muted mt-8">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-foreground underline underline-offset-4">
          Crée-en un
        </Link>
      </p>
    </div>
  );
}
