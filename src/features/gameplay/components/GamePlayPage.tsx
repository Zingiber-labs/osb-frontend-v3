import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { MissionConfig } from "@/features/gameplay/engine/types";
import { createReplayFeed, findTeamId } from "@/features/gameplay/feeds/replayFeed";
import { useScenario } from "@/features/gameplay/hooks/useScenario";
import type { RendererPort } from "@/features/gameplay/renderer/RendererPort";
import { findGame, games } from "@/fixtures/games";
import { HudOverlay } from "./hud/HudOverlay";
import { ResultOverlay } from "./ResultOverlay";
import { ScenarioCanvas } from "./ScenarioCanvas";
import { SetupPanel } from "./SetupPanel";
import type { StartConfig } from "./types";

// Upper bound on waiting for the animation queue, so a stuck animation can never hide the result forever.
const RESULT_MAX_WAIT_MS = 8000;
const DEFAULT_MISSION: MissionConfig = { stat: "pts", target: 20 };

export function GamePlayPage() {
  const [params] = useSearchParams();
  const gameIdParam = params.get("gameId");
  const playerIdParam = params.get("playerId");
  const urlError = gameIdParam && !findGame(gameIdParam) ? `No recorded game with id "${gameIdParam}". Pick one below.` : null;

  const [config, setConfig] = useState<StartConfig | null>(null);
  const [renderer, setRenderer] = useState<RendererPort | null>(null);
  // Bumped on Replay so the canvas (and its renderer) remount with a fresh scene.
  const [runKey, setRunKey] = useState(0);

  const game = config ? findGame(config.gameId) : undefined;
  const feed = useMemo(
    () => (config && game ? createReplayFeed(game, { myPlayerId: config.playerId, speed: config.speed }) : null),
    [config, game],
  );
  const mission = config?.mission ?? DEFAULT_MISSION;
  const state = useScenario(feed, mission, renderer);
  const [showResult, setShowResult] = useState(false);
  const finished = state.status === "won" || state.status === "lost";
  useEffect(() => {
    if (!finished) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cap = new Promise<void>((resolve) => { timer = setTimeout(resolve, RESULT_MAX_WAIT_MS); });
    const idle = renderer ? renderer.whenIdle() : cap;
    void Promise.race([idle, cap]).then(() => {
      if (!cancelled) setShowResult(true);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [finished, renderer]);
  const handleReady = useCallback((r: RendererPort) => setRenderer(r), []);

  useEffect(() => {
    if (!feed || !renderer) return;
    feed.start();
    return () => feed.pause();
  }, [feed, renderer]);

  const exit = () => {
    feed?.stop();
    setShowResult(false);
    setConfig(null);
    setRenderer(null);
  };

  const replay = () => {
    if (!config) return;
    feed?.stop();
    setShowResult(false);
    setRenderer(null);
    setRunKey((k) => k + 1);
    // A new object makes useMemo build a fresh feed for the same game and player.
    setConfig({ ...config });
  };

  if (!config || !game) {
    return (
      <section className="flex flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">Game Play</h1>
        <SetupPanel games={games} initialGameId={gameIdParam ?? undefined} initialPlayerId={playerIdParam ?? undefined} error={urlError} onStart={setConfig} />
      </section>
    );
  }

  const myTeamId = findTeamId(game, config.playerId);
  const playerName = [...game.home.players, ...game.away.players].find((p) => p.id === config.playerId)?.name ?? "";

  return (
    <section className="fixed inset-0 z-30 flex flex-col bg-slate-950">
      <h1 className="sr-only">Game Play</h1>
      <HudOverlay state={state} game={game} myTeamId={myTeamId} playerName={playerName} feed={feed} onExit={exit} />
      <ScenarioCanvas key={runKey} onReady={handleReady} />
      {showResult ? <ResultOverlay state={state} mission={mission} onReplay={replay} onExit={exit} /> : null}
    </section>
  );
}
