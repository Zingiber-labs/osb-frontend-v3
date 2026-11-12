import type { Clock } from "@/features/gameplay/engine/types";
import { formatClock, periodLabel } from "./format";

type Props = { clock: Clock; onExit: () => void };

export function ClockPanel({ clock, onExit }: Props) {
  return (
    <div data-hud-panel="clock" className="flex flex-col gap-1 border-l border-t border-hud-chrome/70 pl-3 pt-2">
      <div className="flex items-baseline gap-3 font-display">
        <span className="text-xs tracking-[0.3em] text-hud-chrome">{periodLabel(clock.period)}</span>
        <span className="text-2xl tabular-nums tracking-wider text-slate-100">{formatClock(clock.secondsLeft)}</span>
        <span className="flex items-center gap-1 text-[10px] tracking-[0.3em] text-hud-theirs">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-hud-theirs motion-safe:animate-pulse" />
          LIVE
        </span>
      </div>
      <button
        type="button"
        onClick={onExit}
        className="pointer-events-auto w-fit border border-hud-chrome/60 px-2 py-0.5 font-display text-[10px] tracking-[0.3em] text-hud-chrome hover:border-hud-mine hover:text-hud-mine"
      >
        EXIT
      </button>
    </div>
  );
}
