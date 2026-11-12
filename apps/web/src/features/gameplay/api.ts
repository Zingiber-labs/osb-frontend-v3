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

export type ProcessGameRequest = {
  userId: string;
  idGame: string;
  idPlayer: string;
  points: number;
  blocks: number;
  rebounds: number;
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

/** The backend has reached a verdict: success any time, failure only once the game is over. */
export function isGraded(res: ProcessGameResponse, gameFinished: boolean): boolean {
  if (res.done === true || res.status === "completed") return true;
  if ((res.processedMissions ?? 0) === 0) return false;
  if (res.missionsCompleted === true) return true;
  return res.missionsCompleted === false && gameFinished;
}
