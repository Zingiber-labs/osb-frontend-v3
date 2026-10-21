import { describe, expect, it } from "vitest";
import { games } from "@/fixtures/games";
import { buildTimeline } from "@/features/gameplay/feeds/replayFeed";
import { createInitialState, reduce } from "./reduce";
import type { MissionConfig, ScenarioState, ShipAction } from "./types";

const game = games[0];

function topScorer(): { id: string; pts: number } {
  const tally = new Map<string, number>();
  for (const p of game.plays) {
    if (p.kind !== "score" || !p.points) continue;
    for (const id of p.playerIds) tally.set(id, (tally.get(id) ?? 0) + p.points);
  }
  const [id, pts] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  return { id, pts };
}

function run(myPlayerId: string, mission: MissionConfig) {
  let state = createInitialState(mission);
  const actions: ShipAction[] = [];
  const trace: { before: ScenarioState; after: ScenarioState; actions: ShipAction[] }[] = [];
  for (const item of buildTimeline(game, myPlayerId, 1)) {
    const r = reduce(state, item.event);
    trace.push({ before: state, after: r.state, actions: r.actions });
    actions.push(...r.actions);
    state = r.state;
  }
  return { state, actions, trace };
}

describe("full replay of the shipped fixture", () => {
  const star = topScorer();

  it("has a usable star scorer", () => {
    expect(star.pts).toBeGreaterThanOrEqual(10);
  });

  it("wins with warpOut when the mission is met mid-game, objective fires exactly once", () => {
    const { state, actions } = run(star.id, { stat: "pts", target: Math.ceil(star.pts / 2) });
    expect(state.status).toBe("won");
    expect(state.myPlayerStats.pts).toBe(star.pts);
    expect(actions.at(-1)).toEqual({ type: "warpOut" });
    const objectiveIdx = actions.findIndex((a) => a.type === "objectiveComplete");
    expect(actions.filter((a) => a.type === "objectiveComplete")).toHaveLength(1);
    expect(objectiveIdx).toBeGreaterThan(0);
    expect(objectiveIdx).toBeLessThan(actions.length - 1);
  });

  it("loses with explode when the mission is never met", () => {
    const { state, actions } = run(star.id, { stat: "pts", target: star.pts + 1 });
    expect(state.status).toBe("lost");
    expect(actions.at(-1)).toEqual({ type: "explode" });
    expect(actions.some((a) => a.type === "objectiveComplete")).toBe(false);
  });

  it("fires once per my-team score and keeps the hull at or above 1", () => {
    const { state, actions, trace } = run(star.id, { stat: "pts", target: 999 });
    const myTeamId = game.home.players.some((p) => p.id === star.id) ? game.home.id : game.away.id;
    const myScores = game.plays.filter((p) => p.kind === "score" && p.points && p.teamId === myTeamId).length;
    expect(actions.filter((a) => a.type === "fire")).toHaveLength(myScores);
    expect(state.enemiesDestroyed).toBe(myScores);
    for (const step of trace) expect(step.after.hull).toBeGreaterThanOrEqual(1);
  });

  it("absorbs opponent scores while shield charges exist", () => {
    const { trace } = run(star.id, { stat: "pts", target: 999 });
    const absorbed = trace.filter((s) => s.actions.some((a) => a.type === "hit" && a.absorbed));
    const unabsorbed = trace.filter((s) => s.actions.some((a) => a.type === "hit" && !a.absorbed));
    expect(absorbed.length).toBeGreaterThan(0);
    for (const step of absorbed) {
      expect(step.before.shield).toBeGreaterThan(0);
      expect(step.after.shield).toBe(step.before.shield - 1);
      expect(step.after.hull).toBe(step.before.hull);
    }
    for (const step of unabsorbed) {
      expect(step.before.shield).toBe(0);
      expect(step.after.hull).toBeLessThanOrEqual(step.before.hull);
    }
  });
});
