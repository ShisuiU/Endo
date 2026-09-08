import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import { DailyEntryForm } from "@/components/daily/daily-entry-form";

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

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
