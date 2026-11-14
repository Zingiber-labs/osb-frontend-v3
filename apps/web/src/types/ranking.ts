export interface RankingLevel {
  name: string;
  iconUrl: string;
  rankNumber: number;
}

export interface RankingUser {
  rank: number;
  username: string;
  xp: number;
  level: RankingLevel | null;
}

export interface LeaderboardResponse {
  total: number;
  page: number;
  limit: number;
  data: RankingUser[];
}
