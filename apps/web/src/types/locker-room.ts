export interface LockerPiece {
  pieceId: string;
  index: number;
  row: number;
  col: number;
  unlocked: boolean;
  url: string | null;
  unlockedAt?: string;
}

export interface LockerSeason {
  seasonId: string;
  name: string;
  description: string;
  gridSize: number;
  totalPieces: number;
  unlockedCount: number;
  remaining: number;
  isComplete: boolean;
  completionPercent: number;
  pieces: LockerPiece[];
}
