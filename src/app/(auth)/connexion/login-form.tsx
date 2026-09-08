"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const initialState: AuthState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />
      {state.error && (
        <p role="alert" className="text-[0.9rem] text-accent">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="mt-3 w-full">
        {pending ? "Connexion…" : "Entrer"}
      </Button>
    </form>
  );
}
