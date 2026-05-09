"use client";

import { useGameSocket } from "@/hooks/gameplay/useGameSocket";
import { useGameTeam } from "@/hooks/gameplay/useGameplay";
import { MissionProcess, useMissionProcess } from "@/hooks/missions/useMission";
import { createAssets } from "@/lib/three/assets";
import { createStaticGroups } from "@/lib/three/static-groups";
import { Canvas } from "@react-three/fiber";
import { useSession } from "@/hooks/useSession";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import DialogMissionFailed from "./DialogMissionFailed";
import DialogSuccessConfirmation from "./DialogSuccessConfirmation";
import { Scene } from "./Scene";

export const ThreeGameplayCanvas = () => {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId") ?? "";
  const playerId = searchParams.get("playerId") ?? "";

  const { data: session } = useSession();
  const userId = session?.id;

  const assets = useMemo(() => createAssets(), []);
  const staticGroups = useMemo(() => createStaticGroups(assets), [assets]);

  const { data: playerData } = useGameTeam(gameId, playerId);

  const { boxScore, receivedAt } = useGameSocket(gameId || null);

  const statsArr = playerData?.statistics;
  const stats = Array.isArray(statsArr) ? statsArr[0] : statsArr;
  const isGameFinished = playerData?.time === "Final";

  const payload = useMemo(() => {
    if (!userId || !stats) return null;

    return {
      userId,
      points: stats.pts ?? 0,
      idPlayer: playerId,
      idGame: gameId,
      blocks: stats.blk ?? 0,
      rebounds: stats.reb ?? 0,
      isGameFinished,
    };
  }, [userId, stats, playerId, gameId, isGameFinished]);

  const { data: missionProcess } = useMissionProcess(
    payload as MissionProcess,
    {
      enabled: Boolean(payload),
      refetchIntervalMs: 5000,
      stopWhen: (data) => data?.done === true || data?.status === "completed",
    },
  );

  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const lastTerminalKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!missionProcess) return;

    const isTerminal =
      missionProcess.success === true ||
      typeof missionProcess.missionsCompleted === "boolean" ||
      typeof missionProcess.processedMissions === "number" ||
      typeof missionProcess.message === "string";

    if (!isTerminal) return;
    if ((missionProcess.processedMissions ?? 0) === 0) return;

    const completed = missionProcess.missionsCompleted === true;
    const idPart = missionProcess.id ?? "default";
    const terminalKey = `${idPart}-completed:${completed}-processed:${missionProcess.processedMissions}-final:${isGameFinished}`;

    if (lastTerminalKeyRef.current === terminalKey) return;
    lastTerminalKeyRef.current = terminalKey;

    if (completed) {
      setShowFailed(false);
      setShowSuccess(true);
      return;
    }

    if (!completed && isGameFinished) {
      setShowSuccess(false);
      setShowFailed(true);
    }
  }, [missionProcess, isGameFinished]);

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
          boxScore={boxScore}
          boxScoreReceivedAt={receivedAt}
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
