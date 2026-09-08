import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import { DailyEntryForm } from "@/components/daily/daily-entry-form";
import { isValidISODate } from "@/lib/date";

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  // Le segment vient de l'URL : une date bricolée à la main ne doit pas
  // faire tomber la page (Intl.DateTimeFormat lève sur une date invalide).
  if (!isValidISODate(date)) notFound();

  return (
    <div>
      <div className="px-5 pt-5">
        <Link
          href="/calendrier"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ChevronLeftIcon className="w-4 h-4" /> Calendrier
        </Link>
      </div>
      <DailyEntryForm date={date} />
    </div>
  );
}
