import type { EnemySize, Points } from "./types";

export const HULL_MAX = 100;
export const HULL_MIN = 1;
export const SHIELD_MAX = 3;

export const ENEMY_BY_POINTS: Record<Points, EnemySize> = {
  1: "scout",
  2: "fighter",
  3: "cruiser",
};

export const HULL_DAMAGE_BY_POINTS: Record<Points, number> = {
  1: 2,
  2: 4,
  3: 6,
};
