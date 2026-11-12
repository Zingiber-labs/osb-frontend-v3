import { useFlashOnChange } from "./useFlashOnChange";

type Props = { kills: number; combo: number };

export function CountersPanel({ kills, combo }: Props) {
  const killFlash = useFlashOnChange(kills);
  return (
    <div data-hud-panel="counters" className="flex items-end gap-6 border-b border-r border-hud-chrome/70 pb-2 pr-3 text-right font-display">
      <div className="flex flex-col items-end">
        <span className="text-[10px] tracking-[0.3em] text-hud-chrome">KILLS</span>
        <span className={`text-2xl tabular-nums text-slate-100 ${killFlash ? "[text-shadow:0_0_12px_#38bdf8]" : ""}`}>{kills}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] tracking-[0.3em] text-hud-chrome">COMBO</span>
        {/* Keyed so a new combo value replays the zoom; a reset to 0 dims. */}
        <span key={combo} className={`text-2xl tabular-nums ${combo > 0 ? "text-hud-gold motion-safe:animate-in motion-safe:zoom-in-125 motion-safe:duration-300" : "text-slate-500"}`}>
          x{combo}
        </span>
      </div>
    </div>
  );
}
