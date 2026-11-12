import type { GameEvent } from "../engine/types";
import type { Feed } from "./types";

export type TestFeed = Feed & { emit(e: GameEvent): void };

export function createTestFeed(): TestFeed {
  const listeners = new Set<(e: GameEvent) => void>();
  return {
    start() {},
    stop() {},
    pause() {},
    step() {},
    onEvent(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    emit(e) {
      for (const l of listeners) l(e);
    },
  };
}
