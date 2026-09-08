import type { Metadata } from "next";
import { TodayForm } from "./today-form";

export const metadata: Metadata = { title: "Aujourd'hui" };

export default function TodayPage() {
  return <TodayForm />;
}
