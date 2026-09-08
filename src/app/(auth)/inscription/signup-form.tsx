"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const initialState: AuthState = { error: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  if (state.info) {
    return (
      <p role="status" className="text-[0.95rem] text-foreground leading-relaxed">
        {state.info}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Prénom (optionnel)" name="displayName" type="text" autoComplete="given-name" />
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        hint="8 caractères minimum."
      />
      {state.error && (
        <p role="alert" className="text-[0.9rem] text-accent">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="mt-3 w-full">
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
