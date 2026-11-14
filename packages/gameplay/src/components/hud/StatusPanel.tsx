import { HULL_MAX, SHIELD_MAX } from "../../engine/mapping";
import { SegmentBar } from "./SegmentBar";
import { useFlashOnChange } from "./useFlashOnChange";

type Props = { hull: number; shield: number };

export const HULL_SEGMENTS = 20;

export function StatusPanel({ hull, shield }: Props) {
  const low = hull / HULL_MAX < 0.25;
  const shieldFlash = useFlashOnChange(shield);
  return (
    <div data-hud-panel="status" className="flex flex-col gap-2 border-b border-l border-hud-chrome/70 pb-2 pl-3">
      <div className="flex items-center gap-3">
        <span className="w-14 font-display text-[10px] tracking-[0.3em] text-hud-chrome">HULL</span>
        <SegmentBar label="hull" value={hull} max={HULL_MAX} segments={HULL_SEGMENTS} low={low} />
        <span className={`w-8 font-display text-sm tabular-nums ${low ? "text-hud-theirs" : "text-slate-100"}`}>{hull}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-14 font-display text-[10px] tracking-[0.3em] text-hud-chrome">SHIELD</span>
        <SegmentBar label="shield" value={shield} max={SHIELD_MAX} segments={SHIELD_MAX} className={shieldFlash ? "brightness-200" : ""} />
      </div>
    </div>
  );
}
