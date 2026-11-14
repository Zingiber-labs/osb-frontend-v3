import { ENEMY_BY_POINTS, HULL_DAMAGE_BY_POINTS, HULL_MAX, HULL_MIN, SHIELD_MAX } from "./mapping";
import type { GameEvent, MissionConfig, ReduceResult, ScenarioState, ShipAction } from "./types";

export function createInitialState(mission: MissionConfig): ScenarioState {
  return {
    hull: HULL_MAX,
    shield: 0,
    combo: 0,
    enemiesDestroyed: 0,
    myPlayerStats: { pts: 0, blk: 0, stl: 0, tov: 0 },
    mission: { stat: mission.stat, target: mission.target, met: false },
    clock: { period: 1, secondsLeft: 720, home: 0, away: 0 },
    status: "pending",
  };
}

/** Adds the event's label as a caption without introducing an undefined key. */
function captioned<A extends ShipAction>(action: A, label: string | undefined): A {
  return label ? { ...action, caption: label } : action;
}

export function reduce(state: ScenarioState, event: GameEvent): ReduceResult {
  if (state.status === "won" || state.status === "lost") {
    return { state, actions: [] };
  }

  const actions: ShipAction[] = [];
  const next: ScenarioState = { ...state, clock: event.at };

  switch (event.kind) {
    case "tipoff": {
      next.status = "live";
      break;
    }
    case "period": {
      break;
    }
    case "score": {
      if (event.side === "mine") {
        next.enemiesDestroyed += 1;
        if (event.byMyPlayer) {
          next.combo += 1;
          next.myPlayerStats = { ...next.myPlayerStats, pts: next.myPlayerStats.pts + event.points };
        }
        actions.push(captioned({ type: "fire", size: ENEMY_BY_POINTS[event.points], charged: event.byMyPlayer }, event.label));
      } else {
        next.combo = 0;
        if (next.shield > 0) {
          next.shield -= 1;
          actions.push(captioned({ type: "hit", points: event.points, absorbed: true }, event.label));
        } else {
          next.hull = Math.max(HULL_MIN, next.hull - HULL_DAMAGE_BY_POINTS[event.points]);
          actions.push(captioned({ type: "hit", points: event.points, absorbed: false }, event.label));
        }
      }
      break;
    }
    case "block":
    case "steal": {
      if (event.side === "mine") {
        next.shield = Math.min(SHIELD_MAX, next.shield + 1);
        if (event.byMyPlayer) {
          const stats = { ...next.myPlayerStats };
          if (event.kind === "block") stats.blk += 1;
          else stats.stl += 1;
          next.myPlayerStats = stats;
        }
        actions.push(captioned({ type: "shieldUp" }, event.label));
      } else {
        actions.push(captioned({ type: "fizzle" }, event.label));
      }
      break;
    }
    case "turnover": {
      if (event.side === "mine") {
        if (event.byMyPlayer) {
          next.combo = 0;
          next.myPlayerStats = { ...next.myPlayerStats, tov: next.myPlayerStats.tov + 1 };
        }
        actions.push(captioned({ type: "stall" }, event.label));
      } else {
        actions.push(captioned({ type: "enemyMalfunction" }, event.label));
      }
      break;
    }
    case "final": {
      break;
    }
  }

  if (!next.mission.met && next.myPlayerStats[next.mission.stat] >= next.mission.target) {
    next.mission = { ...next.mission, met: true };
    actions.push({ type: "objectiveComplete" });
  }

  if (event.kind === "final") {
    next.status = next.mission.met ? "won" : "lost";
    actions.push(next.mission.met ? { type: "warpOut" } : { type: "explode" });
  }

  return { state: next, actions };
}
