import type { Clock } from "./types";

export function at(overrides: Partial<Clock> = {}): Clock {
  return { period: 1, secondsLeft: 720, home: 0, away: 0, ...overrides };
}
