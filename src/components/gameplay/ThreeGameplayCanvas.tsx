"use client";

import { useGameTeam } from "@/hooks/gameplay/useGameplay";
import { useMissionProcess } from "@/hooks/missions/useMission";
import { createAssets } from "@/lib/three/assets";
import { createStaticGroups } from "@/lib/three/static-groups";
import { Canvas } from "@react-three/fiber";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Scene } from "./Scene";
import DialogSuccessConfirmation from "./DialogSuccessConfirmation";
import DialogMissionFailed from "./DialogMissionFailed";

export const ThreeGameplayCanvas = () => {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId") ?? "";
  const playerId = searchParams.get("playerId") ?? "";
  const { data: session } = useSession();
  const userId = (session?.user as any)?.profile?.userId;

  const assets = useMemo(() => createAssets(), []);
  const staticGroups = useMemo(() => createStaticGroups(assets), [assets]);

  const { data: playerData } = useGameTeam(gameId, playerId);

  const payload = {
    userId,
    points: playerData?.statistics.pts,
    idPlayer: playerId,
    idGame: gameId,
    blocks: playerData?.statistics.blk,
    rebounds: playerData?.statistics.reb,
  };

  const { data: missionProcess } = useMissionProcess(payload, {
    enabled: Boolean(userId),
    refetchIntervalMs: 5000,
    stopWhen: (data) => data?.done === true || data?.status === "completed",
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);

  const [hasHandledResult, setHasHandledResult] = useState(false);

  useEffect(() => {
    if (!missionProcess || hasHandledResult) return;

    const isFinished =
      missionProcess?.done === true || missionProcess?.status === "completed";

    if (!isFinished) return;

    setHasHandledResult(true);

    if (missionProcess?.missionCompleted === 1) {
      setShowSuccess(true);
    } else {
      setShowFailed(true);
    }
  }, [missionProcess, hasHandledResult]);

  return (
    <>
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

      <DialogSuccessConfirmation
        open={showSuccess}
        onOpenChange={setShowSuccess}
        onConfirm={() => {
          setShowSuccess(false);
        }}
      />

      <DialogMissionFailed open={showFailed} onOpenChange={setShowFailed} />
    </>
  );
};
