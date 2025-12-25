"use client";

import { useSearchParams } from "next/navigation";
import { ThreeGameplayCanvas } from "@/components/gameplay/ThreeGameplayCanvas";
import { useGameTeam } from "@/hooks/gameplay/useGameplay";

export default function GameplayPage() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId") ?? "";

  const { data: teamData, isLoading, isError } = useGameTeam(teamId);
  console.log("Team Data:", teamData, isLoading, isError);

  return <ThreeGameplayCanvas />;
}
