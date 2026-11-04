import type { PlayEntry, PlayTone } from "./usePlayLog";

const TONE: Record<PlayTone, string> = {
  mine: "border-hud-mine/70 text-hud-mine",
  charged: "border-hud-gold/70 text-hud-gold",
  theirs: "border-hud-theirs/70 text-hud-theirs",
};

/** Last plays as chips, newest on the right; the oldest fades. Hidden below md. */
export function PlayTicker({ entries }: { entries: PlayEntry[] }) {
  return (
    <div data-hud-panel="ticker" aria-label="recent plays" className="hidden items-center gap-2 md:flex">
      {entries.map((e, i) => (
        <span
          key={e.id}
          className={`border px-2 py-0.5 text-xs font-semibold tracking-wider motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-300 ${TONE[e.tone]}`}
          style={{ opacity: 0.4 + (0.6 * (i + 1)) / entries.length }}
        >
          {e.label}
        </span>
      ))}
    </div>
  );
}
