"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { fetchEntriesInRange } from "@/lib/entries-client";
import { isoDate, todayISO } from "@/lib/date";
import { cn } from "@/lib/cn";
import type { DailyEntry } from "@/lib/supabase/types";

const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

export function MonthGrid() {
  const router = useRouter();
  const [cursor, setCursor] = useState<{ year: number; month: number } | null>(null);
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
  const today = todayISO();

  useEffect(() => {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
  }, []);

  useEffect(() => {
    if (!cursor) return;
    const start = isoDate(new Date(cursor.year, cursor.month, 1));
    const end = isoDate(new Date(cursor.year, cursor.month + 1, 0));
    fetchEntriesInRange(start, end).then((rows) => {
      const map: Record<string, DailyEntry> = {};
      for (const row of rows) map[row.entry_date] = row;
      setEntries(map);
    });
  }, [cursor]);

  const cells = useMemo(() => {
    if (!cursor) return [];
    const first = new Date(cursor.year, cursor.month, 1);
    const startOffset = (first.getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();

    const items: Array<{ date: string; day: number } | null> = [];
    for (let i = 0; i < startOffset; i++) items.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      items.push({ date: isoDate(new Date(cursor.year, cursor.month, day)), day });
    }
    return items;
  }, [cursor]);

  if (!cursor) return null;

  const label = MONTH_FORMATTER.format(new Date(cursor.year, cursor.month, 1));

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-6">
        <button
          aria-label="Mois précédent"
          onClick={() => setCursor((c) => c && { year: c.month === 0 ? c.year - 1 : c.year, month: (c.month + 11) % 12 })}
          className="text-muted hover:text-foreground p-1"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="font-display italic text-xl capitalize">{label}</h1>
        <button
          aria-label="Mois suivant"
          onClick={() => setCursor((c) => c && { year: c.month === 11 ? c.year + 1 : c.year, month: (c.month + 1) % 12 })}
          className="text-muted hover:text-foreground p-1"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-[0.65rem] uppercase tracking-wide text-muted/70 pb-2">
            {w}
          </span>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <span key={`empty-${i}`} />;
          const entry = entries[cell.date];
          const isToday = cell.date === today;
          return (
            <button
              key={cell.date}
              onClick={() => router.push(`/jour/${cell.date}`)}
              className="relative flex flex-col items-center justify-center aspect-square"
            >
              <span
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm tabular transition-colors",
                  isToday ? "border border-ink text-ink font-medium" : "text-foreground",
                  entry && !isToday && "bg-ivory-deep"
                )}
              >
                {cell.day}
              </span>
              <span className="flex gap-0.5 h-1.5 mt-0.5">
                {entry?.had_crisis && <Dot color="var(--color-rosewood)" />}
                {entry?.medication_taken && <Dot color="var(--color-brass)" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 justify-center mt-8 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Dot color="var(--color-rosewood)" /> Crise
        </span>
        <span className="flex items-center gap-1.5">
          <Dot color="var(--color-brass)" /> Médicament
        </span>
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />;
}
