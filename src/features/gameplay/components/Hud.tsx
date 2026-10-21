import { HULL_MAX, SHIELD_MAX } from "@/features/gameplay/engine/mapping";
import type { ScenarioState } from "@/features/gameplay/engine/types";
import type { RecordedGame } from "@/features/gameplay/feeds/types";

type Props = { state: ScenarioState; game: RecordedGame; myTeamId: string };

const STAT_LABEL = { pts: "PTS", blk: "BLK", stl: "STL" } as const;

function formatClock(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = Math.floor(secondsLeft % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Hud({ state, game, myTeamId }: Props) {
  const mine = (id: string) => (id === myTeamId ? "text-cyan-300" : "text-slate-400");
  const periodLabel = state.clock.period <= 4 ? `Q${state.clock.period}` : `OT${state.clock.period - 4}`;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-4 p-3 text-sm">
      <div className="flex items-center gap-2">
        <span>HULL</span>
        <div role="progressbar" aria-label="hull" aria-valuemin={0} aria-valuemax={HULL_MAX} aria-valuenow={state.hull} className="h-3 w-40 overflow-hidden rounded bg-slate-800">
          <div className="h-full bg-emerald-400" style={{ width: `${(state.hull / HULL_MAX) * 100}%` }} />
        </div>
      </div>
      <div role="img" className="flex items-center gap-1" aria-label={`shield ${state.shield} of ${SHIELD_MAX}`}>
        <span>SHIELD</span>
        {Array.from({ length: SHIELD_MAX }, (_, i) => (
          <span key={i} className={`inline-block h-3 w-3 rounded-full ${i < state.shield ? "bg-cyan-300" : "bg-slate-700"}`} />
        ))}
      </div>
      <div>COMBO x{state.combo}</div>
      <div data-testid="score" className="font-mono">
        <span className={mine(game.home.id)}>{game.home.abbreviation} {state.clock.home}</span>
        {" - "}
        <span className={mine(game.away.id)}>{state.clock.away} {game.away.abbreviation}</span>
      </div>
      <div className="font-mono">{periodLabel} {formatClock(state.clock.secondsLeft)}</div>
      <div>
        MISSION {STAT_LABEL[state.mission.stat]} {state.myPlayerStats[state.mission.stat]} / {state.mission.target}
        {state.mission.met ? " ✓" : ""}
      </div>
      <div>KILLS {state.enemiesDestroyed}</div>
    </div>
  );
}
