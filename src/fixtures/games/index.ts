import type { RecordedGame } from "@/features/gameplay/feeds/types";
import recorded from "./401809958.json";

export const games: RecordedGame[] = [recorded as RecordedGame];

export function findGame(id: string | null | undefined): RecordedGame | undefined {
  return games.find((g) => g.id === id);
}
