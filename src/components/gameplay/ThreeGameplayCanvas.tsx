"use client";

import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { createAssets } from "@/lib/three/assets";
import { createStaticGroups } from "@/lib/three/static-groups";
import { Scene } from "./Scene";
import { useSearchParams } from "next/navigation";
import { useGameTeam } from "@/hooks/gameplay/useGameplay";

export const ThreeGameplayCanvas = () => {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId") ?? "";
  const assets = useMemo(() => createAssets(), []);
  const staticGroups = useMemo(() => createStaticGroups(assets), [assets]);

  const { data: teamData, isLoading, isError } = useGameTeam(teamId);
  console.log("Team Data:", teamData, isLoading, isError);

  return (
    <Canvas
      style={{ height: "100vh", width: "100vw" }}
      gl={{ antialias: false }}
    >
      <Scene assets={assets} staticGroups={staticGroups} />
      <pointLight position={[10, 10, 10]} />
    </Canvas>
  );
};
