"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const GameplayScreen = dynamic(() => import("@/features/gameplay/GameplayScreen").then((m) => m.GameplayScreen), {
  ssr: false,
  loading: () => <div className="flex h-dvh items-center justify-center bg-slate-950 text-slate-300">Loading…</div>,
});

// Backend game and player ids are positive integers in the safe range (the live feed enforces the same);
// anything else would subscribe to a game that cannot exist.
const NUMERIC_ID = /^[1-9]\d{0,15}$/;

function GameplayRoute() {
  const params = useSearchParams();
  const gameId = params.get("gameId") ?? "";
  const playerId = params.get("playerId") ?? "";
  if (!NUMERIC_ID.test(gameId) || !NUMERIC_ID.test(playerId)) {
    return <div className="flex h-dvh items-center justify-center bg-slate-950 text-slate-300">Pick a player in the hangar first.</div>;
  }
  return <GameplayScreen gameId={gameId} playerId={playerId} />;
}

export default function GameplayPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
      <GameplayRoute />
    </Suspense>
  );
}
