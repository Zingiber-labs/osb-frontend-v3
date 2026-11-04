import { Button } from "@/components/ui/button";
import type { MissionConfig, ScenarioState } from "@/features/gameplay/engine/types";
import { STAT_LABEL } from "./hud/format";

type Props = { state: ScenarioState; mission: MissionConfig; onReplay: () => void; onExit: () => void };

export function ResultOverlay({ state, mission, onReplay, onExit }: Props) {
  const won = state.status === "won";
  const stats = state.myPlayerStats;
  const cells: [string, string | number][] = [
    ["KILLS", state.enemiesDestroyed],
    ["HULL", state.hull],
    ["PTS", stats.pts],
    ["BLK + STL", stats.blk + stats.stl],
  ];
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/75 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <div className="flex flex-col items-center gap-5 border-y border-hud-chrome/60 px-10 py-8 text-center font-display">
        <span className="text-[10px] tracking-[0.5em] text-hud-chrome">MISSION</span>
        <h2 className={`text-4xl tracking-[0.2em] md:text-5xl ${won ? "text-hud-mine" : "text-hud-theirs"}`}>
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
        <div className="flex gap-3 font-sans">
          <Button onClick={onReplay}>Replay</Button>
          <Button variant="outline" onClick={onExit}>Back to setup</Button>
        </div>
      </div>
    </div>
  );
}
