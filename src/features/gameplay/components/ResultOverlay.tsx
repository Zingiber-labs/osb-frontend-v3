import { Button } from "@/components/ui/button";
import type { ScenarioState } from "@/features/gameplay/engine/types";

type Props = { state: ScenarioState; onReplay: () => void };

export function ResultOverlay({ state, onReplay }: Props) {
  const won = state.status === "won";
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80">
      <div className="flex flex-col items-center gap-3 rounded border border-slate-700 bg-slate-900 p-6 text-center">
        <h2 className={`text-3xl font-bold ${won ? "text-emerald-400" : "text-rose-400"}`}>
          {won ? "MISSION SUCCESS" : "MISSION FAILED"}
        </h2>
        <p className="text-slate-300">
          Enemies destroyed {state.enemiesDestroyed} · Hull {state.hull} · PTS {state.myPlayerStats.pts} · BLK {state.myPlayerStats.blk} · STL {state.myPlayerStats.stl} · TOV {state.myPlayerStats.tov}
        </p>
        <Button onClick={onReplay}>Replay</Button>
      </div>
    </div>
  );
}
