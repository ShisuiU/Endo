"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";

const initialState: AuthState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="hairline rounded-xl px-3.5 py-2.5 bg-surface outline-none focus:border-accent/60"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Mot de passe</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="hairline rounded-xl px-3.5 py-2.5 bg-surface outline-none focus:border-accent/60"
        />
      </label>
      {state.error && <p className="text-sm text-accent">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
