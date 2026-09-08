"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";

const initialState: AuthState = { error: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  if (state.info) {
    return <p className="text-sm text-center text-ink-soft leading-relaxed">{state.info}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Prénom (optionnel)</span>
        <input
          name="displayName"
          type="text"
          autoComplete="given-name"
          className="hairline rounded-xl px-3.5 py-2.5 bg-surface outline-none focus:border-accent/60"
        />
      </label>
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
          minLength={8}
          autoComplete="new-password"
          className="hairline rounded-xl px-3.5 py-2.5 bg-surface outline-none focus:border-accent/60"
        />
        <span className="text-xs text-muted/80">8 caractères minimum.</span>
      </label>
      {state.error && <p className="text-sm text-accent">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
