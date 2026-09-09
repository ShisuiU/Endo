"use client";

import { useState, useEffect } from "react";
import { DailyEntryForm } from "@/components/daily/daily-entry-form";
import { MissedDays } from "@/components/daily/missed-days";
import { todayISO } from "@/lib/date";

export function TodayForm() {
  // Calculé côté client pour respecter le fuseau horaire réel de
  // l'utilisatrice plutôt que celui du serveur.
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    setDate(todayISO());
  }, []);

  if (!date) return null;
  return (
    <>
      <DailyEntryForm date={date} />
      {/* Sous la journée du jour : les jours récents restés vides, s'il y en
          a. Le composant ne rend rien quand la semaine est complète. */}
      <div className="px-6">
        <MissedDays />
      </div>
    </>
  );
}
