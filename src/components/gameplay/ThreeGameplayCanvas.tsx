"use client";

import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { createAssets } from "@/lib/three/assets";
import { createStaticGroups } from "@/lib/three/static-groups";
import { Scene } from "./Scene";
import { useSearchParams } from "next/navigation";
import { useGameTeam } from "@/hooks/gameplay/useGameplay";
import { useMissionProcess } from "@/hooks/missions/useMission"; // ajusta el path
import { useSession } from "next-auth/react";

export const ThreeGameplayCanvas = () => {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId") ?? "";
  const playerId = searchParams.get("playerId") ?? "";
  const { data: session } = useSession();
  const userId = (session?.user as any)?.backendUserId;

  const assets = useMemo(() => createAssets(), []);
  const staticGroups = useMemo(() => createStaticGroups(assets), [assets]);

  const { data: playerData } = useGameTeam(gameId, playerId);

  const payload = {
    userId,
    points: playerData?.statistics.pts || 0,
    blocks: playerData?.statistics.blk || 0,
    rebounds: playerData?.statistics.reb || 0,
  };

  const {
    data: missionProcess,
    isFetching: isPollingMissionProcess,
    error,
  } = useMissionProcess(payload, {
    enabled: Boolean(userId),
    refetchIntervalMs: 5000,
    stopWhen: (data) => data?.done === true || data?.status === "completed", // ajusta a tu API
  });

  console.log("Mission Process:", missionProcess);
  console.log("Polling Status:", isPollingMissionProcess);

  return (
    <Canvas
      style={{ height: "100vh", width: "100vw" }}
      gl={{ antialias: false }}
    >
      <Scene
        assets={assets}
        staticGroups={staticGroups}
        playerData={playerData}
      />
      <pointLight position={[10, 10, 10]} />
    </Canvas>
  );
};
