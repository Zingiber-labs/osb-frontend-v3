import type { RecordedGame } from "@/features/gameplay/feeds/types";

const modules = import.meta.glob<RecordedGame>("./*.json", { eager: true, import: "default" });

export const games: RecordedGame[] = Object.values(modules).sort((a, b) => a.date.localeCompare(b.date));

export function findGame(id: string | null | undefined): RecordedGame | undefined {
  return games.find((g) => g.id === id);
}
