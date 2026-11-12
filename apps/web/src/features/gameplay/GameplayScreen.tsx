"use client";

import { HudOverlay, ResultOverlay, ScenarioCanvas, useScenario, type MissionConfig, type RendererPort } from "@osb/gameplay";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { missionConfigFrom, type ActiveMission } from "./api";
import type { LiveFeedError } from "./liveFeed";
import { useActiveMission } from "./useActiveMission";
import { useGameFeed } from "./useGameFeed";
import { useMissionGrading } from "./useMissionGrading";

// Upper bound on waiting for the animation queue, so a stuck animation can never hide the result forever.
const RESULT_MAX_WAIT_MS = 8000;
const PLACEHOLDER_MISSION: MissionConfig = { stat: "pts", target: 1 };

type Props = { gameId: string; playerId: string };

function feedErrorText(err: LiveFeedError): string {
  if (err.reason === "player-not-in-game") return "This player is not part of this game.";
  if (err.reason === "server") return err.message;
  return "We could not reach the live game feed.";
}

export function GameplayScreen({ gameId, playerId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const active = useActiveMission();
  const { feed, game, myPlayerId, mode, error: feedError } = useGameFeed(gameId, playerId);
  // A failed feed only blocks the screen while there is no header; after it, the HUD keeps what was played.
  const feedFailed = Boolean(feedError && !game);

  // The mission is captured once: grading can complete it mid-game, which must not end the session.
  // Captured during render (React's "adjust state on prop change" pattern) so the first loaded render already has it.
  const [lockedMission, setLockedMission] = useState<ActiveMission | null>(null);
  if (active.data && !lockedMission) setLockedMission(active.data);

  const mission = useMemo(() => (lockedMission ? missionConfigFrom(lockedMission.mission.requirements) : null), [lockedMission]);

  useEffect(() => {
    if (!lockedMission && !active.isPending && !active.isFetching && active.data === null) router.replace("/missions");
  }, [lockedMission, active.isPending, active.isFetching, active.data, router]);

  const [renderer, setRenderer] = useState<RendererPort | null>(null);
  const handleReady = useCallback((r: RendererPort) => setRenderer(r), []);

  // Subscribe as soon as the mission is known: this effect must be attached before the start effect below runs.
  const state = useScenario(mission && feed ? feed : null, mission ?? PLACEHOLDER_MISSION, renderer);
  const finished = state.status === "won" || state.status === "lost";

  // Start without waiting for the game header: in live mode the header only arrives after start() subscribes,
  // and the live feed buffers plays until it does; the replay feed's first event is the tipoff.
  const canStart = Boolean(mission && feed && renderer && !feedFailed);
  useEffect(() => {
    if (!canStart || !feed) return;
    feed.start();
    return () => feed.pause();
  }, [canStart, feed, renderer]);

  useEffect(() => {
    if (feedFailed && feed) feed.stop();
  }, [feedFailed, feed]);

  const [showResult, setShowResult] = useState(false);
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

  const grading = useMissionGrading({
    userId: session?.id,
    gameId,
    playerId,
    stats: state.myPlayerStats,
    finished,
    engineWon: state.status === "won",
    rewards: lockedMission?.mission.rewards,
    // Never before the header (zero-stat polls) and never in replay: a recorded game must not post to the backend.
    enabled: Boolean(mission && feed && game) && mode === "live",
  });

  const exit = () => {
    feed?.stop();
    router.push("/hangar");
  };

  if (active.isError && !lockedMission) {
    return (
      <section className="flex h-dvh flex-col items-center justify-center gap-4 bg-slate-950 p-8 text-center text-slate-100">
        <h1 className="font-display text-2xl tracking-[0.2em]">MISSION CONTROL UNAVAILABLE</h1>
        <p className="max-w-md text-slate-300">We could not load your active mission.</p>
        <Link href="/missions" className="underline">Go to Missions</Link>
      </section>
    );
  }

  if (lockedMission && !mission) {
    return (
      <section className="flex h-dvh flex-col items-center justify-center gap-4 bg-slate-950 p-8 text-center text-slate-100">
        <h1 className="font-display text-2xl tracking-[0.2em]">MISSION NOT SUPPORTED</h1>
        <p className="max-w-md text-slate-300">
          “{lockedMission.mission.name}” tracks a stat this scenario cannot visualize yet. Pick a points, blocks, or steals mission.
        </p>
        <Link href="/missions" className="underline">Go to Missions</Link>
      </section>
    );
  }

  if (feedError && !game) {
    return (
      <section className="flex h-dvh flex-col items-center justify-center gap-4 bg-slate-950 p-8 text-center text-slate-100">
        <h1 className="font-display text-2xl tracking-[0.2em]">LIVE FEED UNAVAILABLE</h1>
        <p className="max-w-md text-slate-300">{feedErrorText(feedError)}</p>
        <Link href="/hangar" className="underline">Back to hangar</Link>
      </section>
    );
  }

  const playerName = game ? [...game.home.players, ...game.away.players].find((p) => p.id === myPlayerId)?.name ?? "" : "";
  const myTeamId = game ? (game.home.players.some((p) => p.id === myPlayerId) ? game.home.id : game.away.id) : "";

  return (
    <section className="fixed inset-0 z-30 flex flex-col bg-slate-950">
      <h1 className="sr-only">Game Play</h1>
      {game && mission ? (
        <HudOverlay state={state} game={game} myTeamId={myTeamId} playerName={playerName} feed={feed} onExit={exit} />
      ) : (
        <div className="pointer-events-none absolute inset-x-0 top-6 z-10 text-center font-display text-sm tracking-[0.4em] text-hud-chrome">
          CONNECTING TO MISSION CONTROL…
        </div>
      )}
      <ScenarioCanvas onReady={handleReady} />
      {showResult && mission ? (
        <ResultOverlay state={state} mission={mission} grading={grading} primaryAction={{ label: "Back to hangar", onClick: exit }} />
      ) : null}
    </section>
  );
}
