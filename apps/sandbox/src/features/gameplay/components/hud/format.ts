import type { MissionStat } from "@/features/gameplay/engine/types";

export const STAT_LABEL: Record<MissionStat, string> = { pts: "PTS", blk: "BLK", stl: "STL" };

export function periodLabel(period: number): string {
  return period <= 4 ? `Q${period}` : `OT${period - 4}`;
}

export function formatClock(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = Math.floor(secondsLeft % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
