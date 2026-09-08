import type { Metadata } from "next";
import { StatsView } from "./stats-view";

export const metadata: Metadata = { title: "Repères" };

export default function StatsPage() {
  return <StatsView />;
}
