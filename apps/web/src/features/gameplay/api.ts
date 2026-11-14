import type { MissionConfig } from "@osb/gameplay";
import { api } from "@/lib/api/client";

export type MissionRequirements = { points?: number; assists?: number; blocks?: number; steals?: number };
export type MissionRewards = { xp?: number; gems?: number; coins?: number };

export type ActiveMission = {
  id: string;
  missionId: string;
  mission: { id: number; name: string; requirements: MissionRequirements; rewards: MissionRewards };
  isCompleted: boolean;
  isClaimed: boolean;
};

/** Points first, then blocks, then steals. Assists are not visualized by the engine, so they yield null. */
export function missionConfigFrom(req: MissionRequirements): MissionConfig | null {
  if (req.points && req.points > 0) return { stat: "pts", target: req.points };
  if (req.blocks && req.blocks > 0) return { stat: "blk", target: req.blocks };
  if (req.steals && req.steals > 0) return { stat: "stl", target: req.steals };
  return null;
}

// Decision (checked against https://api.dockinfrax.com/docs-json): GET /auth/profile/missions returns the
// user's assigned missions with isCompleted/isClaimed/progress, so the in-progress one is the first !isCompleted.
export async function fetchActiveMission(): Promise<ActiveMission | null> {
  const { data } = await api.get<ActiveMission[]>("/auth/profile/missions");
  if (!Array.isArray(data)) return null;
  return data.find((m) => !m.isCompleted) ?? null;
}

// Shape per the backend OpenAPI document (ProcessGameStatsDto): ids are numbers; every stat is required.
export type ProcessGameRequest = {
  userId: string;
  idGame: number;
  idPlayer: number;
  points: number;
  rebounds: number;
  blocks: number;
  assists: number;
  steals: number;
  isGameFinished: boolean;
};

export type ProcessGameResponse = {
  done?: boolean;
  status?: string;
  missionsCompleted?: boolean;
  processedMissions?: number;
  message?: string;
};

export async function processGame(req: ProcessGameRequest): Promise<ProcessGameResponse> {
  const { data } = await api.post<ProcessGameResponse>("/missions/process-game", req);
  return data ?? {};
}

/**
 * The backend has reached a verdict: success any time, failure only once the game is over. After the buzzer,
 * "no active missions" with missionsCompleted: true means the mission was completed by an earlier poll.
 */
export function isGraded(res: ProcessGameResponse, gameFinished: boolean): boolean {
  if (res.done === true || res.status === "completed") return true;
  const processed = res.processedMissions ?? 0;
  if (processed > 0 && res.missionsCompleted === true) return true;
  // Nothing left to process: only a verdict at the buzzer, when the mission was already completed earlier.
  if (processed === 0) return gameFinished && res.missionsCompleted === true;
  return res.missionsCompleted === false && gameFinished;
}
