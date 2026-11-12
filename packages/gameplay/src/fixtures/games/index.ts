import type { RecordedGame } from "../../feeds/types";
import game401809958 from "./401809958.json";

export const games: RecordedGame[] = [game401809958 as RecordedGame].sort((a, b) => a.date.localeCompare(b.date));

export function findGame(id: string | null | undefined): RecordedGame | undefined {
  return games.find((g) => g.id === id);
}
