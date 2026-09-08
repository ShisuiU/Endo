import type { Metadata } from "next";
import { MonthGrid } from "@/components/calendar/month-grid";

export const metadata: Metadata = { title: "Calendrier" };

export default function CalendarPage() {
  return <MonthGrid />;
}
