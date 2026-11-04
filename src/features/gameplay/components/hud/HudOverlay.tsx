import type { ScenarioState } from "@/features/gameplay/engine/types";
import type { Feed, RecordedGame } from "@/features/gameplay/feeds/types";
import { ClockPanel } from "./ClockPanel";
import { CountersPanel } from "./CountersPanel";
import { MissionCard } from "./MissionCard";
import { PlayTicker } from "./PlayTicker";
import { ScorePanel } from "./ScorePanel";
import { StatusPanel } from "./StatusPanel";
import { useMissionCard } from "./useMissionCard";
import { usePlayLog } from "./usePlayLog";

type Props = {
  state: ScenarioState;
  game: RecordedGame;
  myTeamId: string;
  playerName: string;
  feed: Feed | null;
  onExit: () => void;
};

/** Cinematic heads-up display: four corners plus center lanes, over the scene. Only Exit takes pointer events. */
export function HudOverlay({ state, game, myTeamId, playerName, feed, onExit }: Props) {
  const entries = usePlayLog(feed);
  const card = useMissionCard(state, { playerName, matchup: `${game.home.abbreviation} vs ${game.away.abbreviation}` });
  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-3 md:p-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-[400ms]">
      <div className="absolute left-3 top-3 md:left-6 md:top-6">
        <ClockPanel clock={state.clock} onExit={onExit} />
      </div>
      <div className="absolute right-3 top-3 md:right-6 md:top-6">
        <ScorePanel clock={state.clock} game={game} myTeamId={myTeamId} stats={state.myPlayerStats} />
      </div>
      <div className="absolute inset-x-0 top-[12%] flex justify-center">
        <MissionCard card={card} />
      </div>
      <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6">
        <StatusPanel hull={state.hull} shield={state.shield} />
      </div>
      <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6">
        <CountersPanel kills={state.enemiesDestroyed} combo={state.combo} />
      </div>
      <div className="absolute inset-x-0 bottom-6 hidden justify-center lg:flex">
        <PlayTicker entries={entries} />
      </div>
      <p className="sr-only">
        MISSION {state.mission.stat.toUpperCase()} {state.myPlayerStats[state.mission.stat]} / {state.mission.target}
        {state.mission.met ? " met" : ""}
      </p>
    </div>
  );
}
