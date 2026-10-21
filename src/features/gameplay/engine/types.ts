export type Side = "mine" | "theirs";

export type Points = 1 | 2 | 3;

export type Clock = {
  period: number;      // 1-4, 5+ = overtime
  secondsLeft: number; // seconds left in the period
  home: number;
  away: number;
};

export type GameEvent =
  | { kind: "tipoff"; at: Clock }
  | { kind: "score"; side: Side; points: Points; byMyPlayer: boolean; at: Clock }
  | { kind: "block"; side: Side; byMyPlayer: boolean; at: Clock }
  | { kind: "steal"; side: Side; byMyPlayer: boolean; at: Clock }
  | { kind: "turnover"; side: Side; byMyPlayer: boolean; at: Clock }
  | { kind: "period"; period: number; at: Clock }
  | { kind: "final"; at: Clock };

export type MissionStat = "pts" | "blk" | "stl";

export type MissionConfig = { stat: MissionStat; target: number };

export type ScenarioStatus = "pending" | "live" | "won" | "lost";

export type MyPlayerStats = { pts: number; blk: number; stl: number; tov: number };

export type ScenarioState = {
  hull: number;             // 1..100
  shield: number;           // 0..3
  combo: number;
  enemiesDestroyed: number;
  myPlayerStats: MyPlayerStats;
  mission: MissionConfig & { met: boolean };
  clock: Clock;
  status: ScenarioStatus;
};

export type EnemySize = "scout" | "fighter" | "cruiser";

export type ShipAction =
  | { type: "fire"; size: EnemySize; charged: boolean }
  | { type: "hit"; points: Points; absorbed: boolean }
  | { type: "shieldUp" }
  | { type: "fizzle" }
  | { type: "stall" }
  | { type: "enemyMalfunction" }
  | { type: "objectiveComplete" }
  | { type: "warpOut" }
  | { type: "explode" };

export type ReduceResult = { state: ScenarioState; actions: ShipAction[] };
