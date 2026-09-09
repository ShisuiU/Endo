import type { DailyEntry } from "@/lib/supabase/types";

const COLUMNS = [
  "Date",
  "Crise",
  "Intensité",
  "Douleur",
  "Sommeil",
  "Humeur",
  "Énergie",
  "Médicament",
  "Détail du médicament",
  "Aliments",
  "Notes",
] as const;

/**
 * Échappement CSV : guillemets doublés, et champ encadré dès qu'il contient
 * un séparateur, un guillemet ou un saut de ligne — les notes libres en
 * contiennent forcément un jour.
 */
function cell(value: string) {
  return /[;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Export du carnet en CSV.
 *
 * Séparateur `;` et BOM UTF-8 : c'est ce qu'attend Excel en configuration
 * française, sinon les accents sortent en mojibake et tout atterrit dans une
 * seule colonne. Numbers et LibreOffice s'en accommodent aussi.
 *
 * Les colonnes sont en français, comme l'app : ce fichier est fait pour être
 * relu, éventuellement montré à un médecin — pas pour être réimporté.
 */
export function entriesToCSV(entries: DailyEntry[]): string {
  const lines = [COLUMNS.join(";")];

  for (const e of entries) {
    lines.push(
      [
        e.entry_date,
        e.had_crisis ? "oui" : "non",
        e.crisis_intensity ?? "",
        e.pain_score ?? "",
        e.sleep_score ?? "",
        e.mood_score ?? "",
        e.energy_score ?? "",
        e.medication_taken ? "oui" : "non",
        e.medication_notes ?? "",
        e.foods.join(", "),
        e.notes ?? "",
      ]
        .map((v) => cell(String(v)))
        .join(";")
    );
  }

  return "﻿" + lines.join("\r\n") + "\r\n";
}
