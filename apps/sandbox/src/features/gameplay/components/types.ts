import type { MissionConfig } from "@/features/gameplay/engine/types";

export type StartConfig = {
  gameId: string;
  playerId: string;
  mission: MissionConfig;
  speed: number;
};
