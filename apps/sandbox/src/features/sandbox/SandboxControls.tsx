import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createInitialState, HULL_MAX, HULL_MIN, SHIELD_MAX } from "@osb/gameplay";
import type { RendererPort, ScenarioState } from "@osb/gameplay";
import { SAMPLE_ACTIONS } from "./sampleActions";

type Props = { renderer: RendererPort | null };

const inputClass = "w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** A live state with the given hull and shield, so the renderer shows the matching damage, vignette and shield glow. */
function sandboxState(hull: number, shield: number): ScenarioState {
  return { ...createInitialState({ stat: "pts", target: 1 }), hull, shield, status: "live" };
}

export function SandboxControls({ renderer }: Props) {
  const [hull, setHull] = useState(HULL_MAX);
  const [shield, setShield] = useState(0);

  const sync = (nextHull: number, nextShield: number) => {
    setHull(nextHull);
    setShield(nextShield);
    renderer?.syncState(sandboxState(nextHull, nextShield));
  };

  return (
    <div className="flex flex-col gap-4 border-t border-slate-800 p-4 text-sm">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          Hull ({HULL_MIN}–{HULL_MAX})
          <input
            className={inputClass}
            type="number"
            min={HULL_MIN}
            max={HULL_MAX}
            value={hull}
            onChange={(e) => sync(clamp(Math.round(Number(e.target.value) || HULL_MIN), HULL_MIN, HULL_MAX), shield)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Shield (0–{SHIELD_MAX})
          <input
            className={inputClass}
            type="number"
            min={0}
            max={SHIELD_MAX}
            value={shield}
            onChange={(e) => sync(hull, clamp(Math.round(Number(e.target.value) || 0), 0, SHIELD_MAX))}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-1">
        {SAMPLE_ACTIONS.map(({ label, action }) => (
          <Button key={label} size="sm" variant="outline" onClick={() => renderer?.enqueue([action])}>
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
