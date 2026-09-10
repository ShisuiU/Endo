"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DaySummaryData = {
  crisis: { step: number; had: boolean; intensity: number | null };
  scores: { step: number; key: string; label: string; value: number | null }[];
  medication: { step: number; taken: boolean; detail: string };
  foods: { step: number; list: string[] };
  notes: { step: number; text: string };
};

/**
 * Le résumé du jour, **écrit**.
 *
 * Troisième version. La première était un bloc-carte, la deuxième une suite
 * de lignes « libellé — valeur » ; les deux ont été écartées, et à raison :
 * une liste de paires reste un tableau, quelle que soit la peinture qu'on
 * met dessus. Ici la journée est une phrase, comme dans un carnet papier —
 * « Crise à 7/10. Douleur 6, sommeil 4… » — avec les nombres composés en
 * Bodoni dans le fil du texte.
 *
 * Chaque fragment reste tapable et rouvre sa question. Ce sont des cibles
 * *en ligne dans un texte* : la règle de taille minimale (WCAG 2.5.8) les
 * exempte explicitement, et l'interligne généreux donne de toute façon des
 * lignes d'environ 44 px.
 *
 * ⚠️ Ne pas « ranger » ce résumé en colonnes, en vignettes ou en lignes de
 * tableau. Voir CLAUDE.md § Le jour où deux blocs génériques sont passés.
 */
export function DaySummary({
  data,
  onOpen,
}: {
  data: DaySummaryData;
  onOpen: (step: number) => void;
}) {
  const { crisis, scores, medication, foods, notes } = data;

  return (
    <div>
      <p className="text-[1.05rem] leading-[2.1] text-muted">
        <Bit onOpen={onOpen} step={crisis.step} label="Modifier la crise">
          {crisis.had ? (
            <>
              <Valeur tone="accent">Crise</Valeur>
              {crisis.intensity !== null && (
                <>
                  {" à "}
                  <Valeur tone="accent">{crisis.intensity}</Valeur>
                  <span className="text-muted">/10</span>
                </>
              )}
            </>
          ) : (
            "Aucune crise"
          )}
        </Bit>
        {". "}
        {scores.map(({ step, key, label, value }, i) => (
          <span key={key}>
            <Bit onOpen={onOpen} step={step} label={`Modifier ${label.toLowerCase()}`}>
              {i === 0 ? label : label.toLowerCase()} <Valeur>{value ?? "–"}</Valeur>
            </Bit>
            {i === scores.length - 1 ? ". " : ", "}
          </span>
        ))}
      </p>

      <p className="mt-1 text-[1.05rem] leading-[2.1] text-muted">
        <Bit onOpen={onOpen} step={medication.step} label="Modifier le médicament">
          {medication.taken ? (
            <Valeur tone="plain">{capitale(medication.detail || "Médicament pris")}</Valeur>
          ) : (
            "Pas de médicament"
          )}
        </Bit>
        {". "}
        <Bit onOpen={onOpen} step={foods.step} label="Modifier les repas">
          {foods.list.length > 0 ? (
            <Valeur tone="plain">{capitale(foods.list.join(", "))}</Valeur>
          ) : (
            "Rien noté côté repas"
          )}
        </Bit>
        {". "}
      </p>

      <p className="mt-1 text-[1.05rem] leading-[2.1] text-muted">
        <Bit onOpen={onOpen} step={notes.step} label="Modifier les notes">
          {notes.text ? (
            <span className="italic text-foreground">«&nbsp;{notes.text}&nbsp;»</span>
          ) : (
            "Pas de note."
          )}
        </Bit>
      </p>

      <p className="mt-5 text-[0.78rem] text-muted/70">
        Choisis un mot pour revenir sur sa question.
      </p>
    </div>
  );
}

/**
 * Majuscule d'attaque : ces fragments ouvrent une phrase, et le texte vient
 * de la saisie (« spasfon », « riz »). Sans ça on lisait « Spasfon, 14 h.
 * riz. » — une minuscule après un point.
 */
const capitale = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/** Fragment tapable dans la phrase — rouvre le parcours à sa question. */
function Bit({
  step,
  label,
  onOpen,
  children,
}: {
  step: number;
  label: string;
  onOpen: (step: number) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onOpen(step)}
      className="text-left underline decoration-transparent underline-offset-[6px] transition-colors hover:decoration-[color:var(--hairline)]"
    >
      {children}
    </button>
  );
}

/** Ce qui a été saisi, composé comme les dates et les scores de l'app. */
function Valeur({
  children,
  tone = "number",
}: {
  children: ReactNode;
  tone?: "number" | "accent" | "plain";
}) {
  return (
    <span
      className={cn(
        tone === "plain"
          ? "text-foreground"
          : "font-display italic text-[1.35rem] leading-none tabular",
        tone === "accent" ? "text-accent" : "text-foreground"
      )}
    >
      {children}
    </span>
  );
}
