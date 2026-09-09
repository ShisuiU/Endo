"use client";

import { useState, useEffect } from "react";
import { DailyEntryForm } from "@/components/daily/daily-entry-form";
import { todayISO } from "@/lib/date";

export function TodayForm() {
  // Calculé côté client pour respecter le fuseau horaire réel de
  // l'utilisatrice plutôt que celui du serveur.
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    setDate(todayISO());
  }, []);

  if (!date) return null;
  return <DailyEntryForm date={date} />;
}
