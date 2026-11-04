import type { ScenarioState } from "@/features/gameplay/engine/types";
import { periodLabel, STAT_LABEL } from "./format";

export type CardTone = "mine" | "gold" | "neutral";
export type MissionCardData = { eyebrow: string; headline: string; subline?: string; tone: CardTone; ms: number };
export type CardContext = { playerName: string; matchup: string };

export const TIPOFF_MS = 4000;
export const EVENT_MS = 3000;

const progress = (s: ScenarioState) => `${s.myPlayerStats[s.mission.stat]} / ${s.mission.target} ${STAT_LABEL[s.mission.stat]}`;

/** Which card a state transition deserves, if any. Pure; the hook owns the timer. */
export function cardFor(prev: ScenarioState, next: ScenarioState, ctx: CardContext): MissionCardData | null {
  if (prev.status === "pending" && next.status === "live") {
    return {
      eyebrow: "MISSION",
      headline: `${next.mission.target} ${STAT_LABEL[next.mission.stat]} · ${ctx.playerName.toUpperCase()}`,
      subline: ctx.matchup,
      tone: "mine",
      ms: TIPOFF_MS,
    };
  }
  if (next.status === "live" && !prev.mission.met && next.mission.met) {
    return { eyebrow: "OBJECTIVE", headline: "OBJECTIVE COMPLETE", subline: progress(next), tone: "gold", ms: EVENT_MS };
  }
  if ((next.status === "won" || next.status === "lost") && prev.status === "live") {
    return { eyebrow: "FINAL", headline: "FINAL", subline: progress(next), tone: "neutral", ms: EVENT_MS };
  }
  if (next.status === "live" && next.clock.period !== prev.clock.period) {
    return { eyebrow: "PERIOD", headline: periodLabel(next.clock.period), subline: progress(next), tone: "neutral", ms: EVENT_MS };
  }
  return null;
}
