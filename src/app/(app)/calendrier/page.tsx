import type { Metadata } from "next";
import { MonthRing } from "@/components/calendar/month-ring";

export const metadata: Metadata = { title: "Calendrier" };

export default function CalendarPage() {
  return <MonthRing />;
}
