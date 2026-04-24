import { GlobalLeaderboard } from "@/components/ranking/GlobalLeaderboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard Global | Outer Sports Baller",
  description: "Consulta el ranking mundial de jugadores de Outer Sports Baller y compite por ser el mejor.",
};

export default function RankingPage() {
  return (
    <main className="min-h-screen pt-10 pb-20">
      <GlobalLeaderboard />
    </main>
  );
}
