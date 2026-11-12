import type { MissionConfig, ScenarioState } from "../engine/types";
import { Button } from "./Button";
import { STAT_LABEL } from "./hud/format";

export type GradingView =
  | { status: "grading" }
  | { status: "graded"; completed: boolean; rewards?: { xp?: number; coins?: number; gems?: number } }
  | { status: "error"; message: string };

export type ResultAction = { label: string; onClick: () => void };

type Props = {
  state: ScenarioState;
  mission: MissionConfig;
  /** Backend verdict, when the host app grades missions. Omitted: the engine verdict stands alone. */
  grading?: GradingView;
  primaryAction: ResultAction;
  secondaryAction?: ResultAction;
};

function GradingLine({ grading, engineWon }: { grading: GradingView; engineWon: boolean }) {
  if (grading.status === "grading") return <p className="text-xs tracking-[0.3em] text-hud-chrome motion-safe:animate-pulse">GRADING MISSION…</p>;
  if (grading.status === "error") return <p className="text-xs tracking-[0.2em] text-hud-theirs">{grading.message}</p>;
  if (!grading.completed) {
    return <p className="text-xs tracking-[0.2em] text-hud-theirs">{engineWon ? "MISSION NOT CREDITED BY HQ" : "NO REWARDS THIS TIME"}</p>;
  }
  const rewards = Object.entries(grading.rewards ?? {}).filter((entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0);
  return (
    <div className="flex gap-4 text-sm tracking-[0.2em] text-hud-gold">
      {rewards.length === 0 ? <span>MISSION CREDITED</span> : rewards.map(([k, v]) => <span key={k}>{`+${v} ${k.toUpperCase()}`}</span>)}
    </div>
  );
}

export function ResultOverlay({ state, mission, grading, primaryAction, secondaryAction }: Props) {
  const won = state.status === "won";
  const stats = state.myPlayerStats;
  const cells: [string, string | number][] = [
    ["KILLS", state.enemiesDestroyed],
    ["HULL", state.hull],
    ["PTS", stats.pts],
    ["BLK + STL", stats.blk + stats.stl],
  ];
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="result-title" className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/75 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <div className="flex flex-col items-center gap-5 border-y border-hud-chrome/60 px-10 py-8 text-center font-display">
        <span className="text-[10px] tracking-[0.5em] text-hud-chrome">MISSION</span>
        <h2 id="result-title" className={`text-4xl tracking-[0.2em] md:text-5xl ${won ? "text-hud-mine" : "text-hud-theirs"}`}>
          {won ? "MISSION SUCCESS" : "MISSION FAILED"}
        </h2>
        <p className="text-sm tracking-[0.3em] text-slate-300">
          {stats[mission.stat]} / {mission.target} {STAT_LABEL[mission.stat]}
        </p>
        <dl className="flex gap-8">
          {cells.map(([k, v]) => (
            <div key={k} className="flex flex-col items-center">
              <dt className="text-[10px] tracking-[0.3em] text-hud-chrome">{k}</dt>
              <dd className="text-2xl tabular-nums text-slate-100">{v}</dd>
            </div>
          ))}
        </dl>
        {grading ? <GradingLine grading={grading} engineWon={won} /> : null}
        <div className="flex gap-3 font-sans">
          <Button autoFocus onClick={primaryAction.onClick}>{primaryAction.label}</Button>
          {secondaryAction ? <Button variant="outline" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button> : null}
        </div>
      </div>
    </div>
  );
}
