import type { ShipAction } from "@/features/gameplay/engine/types";

/** One of each ship action with a realistic caption, for exercising the renderer without game data. */
export const SAMPLE_ACTIONS: { label: string; action: ShipAction }[] = [
  { label: "fire scout", action: { type: "fire", size: "scout", charged: false, caption: "MORANT +1" } },
  { label: "fire fighter", action: { type: "fire", size: "fighter", charged: false, caption: "MORANT +2" } },
  { label: "fire cruiser charged", action: { type: "fire", size: "cruiser", charged: true, caption: "COWARD +3" } },
  { label: "hit 3", action: { type: "hit", points: 3, absorbed: false, caption: "SIAKAM +3" } },
  { label: "hit absorbed", action: { type: "hit", points: 2, absorbed: true, caption: "SIAKAM +2" } },
  { label: "shieldUp", action: { type: "shieldUp", caption: "JACKSON BLOCK" } },
  { label: "fizzle", action: { type: "fizzle", caption: "SIAKAM STEAL" } },
  { label: "stall", action: { type: "stall", caption: "MORANT TURNOVER" } },
  { label: "enemyMalfunction", action: { type: "enemyMalfunction", caption: "IND TURNOVER" } },
  { label: "objectiveComplete", action: { type: "objectiveComplete" } },
  { label: "warpOut", action: { type: "warpOut" } },
  { label: "explode", action: { type: "explode" } },
];
