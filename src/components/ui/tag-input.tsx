"use client";

import { useState, type KeyboardEvent } from "react";
import { CloseIcon } from "@/components/icons";

/**
 * Saisie d'aliments en étiquettes libres. Entrée ou virgule pour ajouter,
 * croix pour retirer. Les étiquettes font 40 px et leur bouton de
 * suppression 32 px — assez large pour ne pas rater la cible.
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
    <div className="hairline rounded-2xl px-3 py-2.5 flex flex-wrap items-center gap-2 focus-within:border-accent/60">
      {values.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-surface-2 pl-4 pr-1 h-10 text-[0.85rem] text-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(values.filter((t) => t !== tag))}
            aria-label={`Retirer ${tag}`}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-foreground"
          >
            <CloseIcon className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={values.length === 0 ? placeholder : undefined}
        className="flex-1 min-w-[10ch] h-10 bg-transparent text-[0.95rem] outline-none placeholder:text-muted/70"
      />
    </div>
  );
}
