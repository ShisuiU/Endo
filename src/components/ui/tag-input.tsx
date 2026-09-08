"use client";

import { useState, type KeyboardEvent } from "react";
import { CloseIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Saisie d'aliments libres sous forme d'étiquettes. Entrée ou virgule pour
 * ajouter, croix fine pour retirer — pas de composant de librairie UI.
 */
export function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const cleaned = draft.trim();
    if (!cleaned) return;
    if (!values.includes(cleaned)) onChange([...values, cleaned]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className="hairline rounded-xl px-3 py-2.5 flex flex-wrap items-center gap-1.5 focus-within:border-accent/60">
      {values.map((tag) => (
        <span
          key={tag}
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-ivory-deep px-2.5 py-1 text-xs text-ink-soft"
          )}
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(values.filter((t) => t !== tag))}
            aria-label={`Retirer ${tag}`}
            className="opacity-60 hover:opacity-100"
          >
            <CloseIcon className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={values.length === 0 ? placeholder : undefined}
        className="flex-1 min-w-[8ch] bg-transparent text-sm outline-none placeholder:text-muted/70 py-1"
      />
    </div>
  );
}
