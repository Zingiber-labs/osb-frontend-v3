export type BarTone = "mine" | "gold" | "theirs";

type Props = {
  label: string;
  value: number;
  max: number;
  segments: number;
  low?: boolean;
  tone?: BarTone;
  /** Extra classes on the wrapper, for one-off flashes. */
  className?: string;
};

const TONE_FILL: Record<BarTone, string> = {
  mine: "bg-hud-mine shadow-[0_0_6px_#38bdf8]",
  gold: "bg-hud-gold shadow-[0_0_6px_#fbbf24]",
  theirs: "bg-hud-theirs shadow-[0_0_6px_#f43f5e]",
};

/** Row of slanted segments; lost segments stay as dim outlines. */
export function SegmentBar({ label, value, max, segments, low = false, tone = "mine", className = "" }: Props) {
  const lit = Math.min(segments, Math.max(0, Math.ceil((value * segments) / max)));
  const fill = low ? TONE_FILL.theirs : TONE_FILL[tone];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      data-low={low ? "true" : "false"}
      className={`flex gap-[3px] ${className}`}
    >
      {Array.from({ length: segments }, (_, i) => {
        const on = i < lit;
        return (
          <span
            key={i}
            data-filled={on ? "true" : "false"}
            className={`h-3 w-1.5 -skew-x-[20deg] md:w-2 motion-safe:transition-colors motion-safe:duration-300 ${on ? fill : "border border-hud-chrome/60 bg-transparent"}`}
          />
        );
      })}
    </div>
  );
}
