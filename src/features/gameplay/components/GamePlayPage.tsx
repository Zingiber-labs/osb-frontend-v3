import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { MissionConfig } from "@/features/gameplay/engine/types";
import { createReplayFeed, findTeamId } from "@/features/gameplay/feeds/replayFeed";
import { useScenario } from "@/features/gameplay/hooks/useScenario";
import type { RendererPort } from "@/features/gameplay/renderer/RendererPort";
import { findGame, games } from "@/fixtures/games";
import { DebugPanel } from "./DebugPanel";
import { Hud } from "./Hud";
import { ResultOverlay } from "./ResultOverlay";
import { ScenarioCanvas } from "./ScenarioCanvas";
import { SetupPanel } from "./SetupPanel";
import type { StartConfig } from "./types";

const DEFAULT_MISSION: MissionConfig = { stat: "pts", target: 20 };

export function GamePlayPage() {
  const [params] = useSearchParams();
  const gameIdParam = params.get("gameId");
  const playerIdParam = params.get("playerId");
  const urlError = gameIdParam && !findGame(gameIdParam) ? `No recorded game with id "${gameIdParam}". Pick one below.` : null;

  const [config, setConfig] = useState<StartConfig | null>(null);
  const [renderer, setRenderer] = useState<RendererPort | null>(null);

  const game = config ? findGame(config.gameId) : undefined;
  const feed = useMemo(
    () => (config && game ? createReplayFeed(game, { myPlayerId: config.playerId, speed: config.speed }) : null),
    [config, game],
  );
  const mission = config?.mission ?? DEFAULT_MISSION;
  const state = useScenario(feed, mission, renderer);
  const handleReady = useCallback((r: RendererPort) => setRenderer(r), []);

  useEffect(() => {
    if (!feed || !renderer) return;
    feed.start();
    return () => feed.stop();
  }, [feed, renderer]);

  const reset = () => {
    setConfig(null);
    setRenderer(null);
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
  const finished = state.status === "won" || state.status === "lost";

  return (
    <section className="relative flex flex-1 flex-col">
      <h1 className="sr-only">Game Play</h1>
      <Hud state={state} game={game} myTeamId={myTeamId} />
      <ScenarioCanvas onReady={handleReady} />
      {import.meta.env.DEV ? <DebugPanel feed={feed} renderer={renderer} /> : null}
      {finished ? <ResultOverlay state={state} onReplay={reset} /> : null}
    </section>
  );
}
