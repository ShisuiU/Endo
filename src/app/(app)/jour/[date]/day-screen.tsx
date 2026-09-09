"use client";

import { useRouter } from "next/navigation";
import { DailyEntryForm } from "@/components/daily/daily-entry-form";

/**
 * Une journée passée, ouverte depuis le calendrier. Même formulaire que
 * l'accueil, avec en plus la possibilité de l'effacer — une journée notée
 * par erreur, ou sur la mauvaise date, doit pouvoir disparaître. On revient
 * au calendrier, d'où l'on venait.
 */
export function DayScreen({ date }: { date: string }) {
  const router = useRouter();

  return (
    <DailyEntryForm
      date={date}
      onDeleted={() => {
        router.push("/calendrier");
        router.refresh();
      }}
    />
  );
}
