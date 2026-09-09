import type { Metadata } from "next";
import { TodayForm } from "./today-form";

export const metadata: Metadata = { title: "Accueil" };

export default function TodayPage() {
  return <TodayForm />;
}
