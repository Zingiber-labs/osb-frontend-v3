import type { GameEvent, Points } from "@/features/gameplay/engine/types";

export interface Feed {
  start(): void;
  stop(): void;
  pause(): void;
  step(): void;
  onEvent(cb: (e: GameEvent) => void): () => void;
}

export type RosterPlayer = { id: string; name: string };

export type TeamRoster = {
  id: string;
  name: string;
  abbreviation: string;
  players: RosterPlayer[];
};

export type PlayKind = "score" | "block" | "steal" | "turnover" | "period" | "final" | "other";

export type RecordedPlay = {
  order: number;
  period: number;
  clockSeconds: number; // seconds left in the period
  homeScore: number;
  awayScore: number;
  kind: PlayKind;
  points?: Points;
  teamId?: string;
  playerIds: string[];
};

export type RecordedGame = {
  id: string;
  date: string;
  home: TeamRoster;
  away: TeamRoster;
  plays: RecordedPlay[];
};
