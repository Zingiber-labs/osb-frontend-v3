import { GlobalLeaderboard } from "@/components/ranking/GlobalLeaderboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Leaderboard | Outer Sports Baller",
  description: "Check the global ranking of Outer Sports Baller players and compete to be the best.",
};

export default function RankingPage() {
  return (
    <main className="min-h-screen pt-10 pb-20">
      <GlobalLeaderboard />
    </main>
  );
}
