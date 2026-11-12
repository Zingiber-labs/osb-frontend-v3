import type { RecordedGame } from "./types";

export const testGame: RecordedGame = {
  id: "test-1",
  date: "2026-01-01T00:00:00Z",
  home: { id: "H", name: "Home Hawks", abbreviation: "HOM", players: [{ id: "h1", name: "Home One" }, { id: "h2", name: "Home Two" }] },
  away: { id: "A", name: "Away Aces", abbreviation: "AWY", players: [{ id: "a1", name: "Away One" }, { id: "a2", name: "Away Two" }] },
  plays: [
    { order: 0, period: 1, clockSeconds: 720, homeScore: 0, awayScore: 0, kind: "other", playerIds: [] },
    { order: 1, period: 1, clockSeconds: 700, homeScore: 2, awayScore: 0, kind: "score", points: 2, teamId: "H", playerIds: ["h1"] },
    { order: 2, period: 1, clockSeconds: 680, homeScore: 2, awayScore: 0, kind: "block", teamId: "A", playerIds: ["a2"] },
    { order: 3, period: 1, clockSeconds: 650, homeScore: 2, awayScore: 3, kind: "score", points: 3, teamId: "A", playerIds: ["a1"] },
    { order: 4, period: 1, clockSeconds: 640, homeScore: 2, awayScore: 3, kind: "turnover", teamId: "H", playerIds: ["h2"] },
    { order: 5, period: 2, clockSeconds: 720, homeScore: 2, awayScore: 3, kind: "period", playerIds: [] },
    { order: 6, period: 2, clockSeconds: 710, homeScore: 3, awayScore: 3, kind: "score", points: 1, teamId: "H", playerIds: ["h1"] },
    { order: 7, period: 4, clockSeconds: 0, homeScore: 3, awayScore: 3, kind: "final", playerIds: [] },
  ],
};
