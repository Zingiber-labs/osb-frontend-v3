import { describe, expect, it } from "vitest";
import { isGraded, missionConfigFrom } from "./api";

describe("missionConfigFrom", () => {
  it("maps points to a pts mission", () => {
    expect(missionConfigFrom({ points: 20 })).toEqual({ stat: "pts", target: 20 });
  });
  it("maps blocks and steals when points are absent", () => {
    expect(missionConfigFrom({ blocks: 3 })).toEqual({ stat: "blk", target: 3 });
    expect(missionConfigFrom({ steals: 2 })).toEqual({ stat: "stl", target: 2 });
  });
  it("prefers points when several are set", () => {
    expect(missionConfigFrom({ points: 10, blocks: 3 })).toEqual({ stat: "pts", target: 10 });
  });
  it("returns null for unsupported or empty requirements", () => {
    expect(missionConfigFrom({ assists: 5 })).toBeNull();
    expect(missionConfigFrom({})).toBeNull();
    expect(missionConfigFrom({ points: 0 })).toBeNull();
  });
});

describe("isGraded", () => {
  it("is graded when the backend says done or completed", () => {
    expect(isGraded({ done: true }, false)).toBe(true);
    expect(isGraded({ status: "completed" }, false)).toBe(true);
    expect(isGraded({ missionsCompleted: true, processedMissions: 1 }, false)).toBe(true);
  });
  it("is graded as failed only once the game is finished", () => {
    expect(isGraded({ missionsCompleted: false, processedMissions: 1 }, false)).toBe(false);
    expect(isGraded({ missionsCompleted: false, processedMissions: 1 }, true)).toBe(true);
  });
  it("is not graded with nothing processed", () => {
    expect(isGraded({ missionsCompleted: false, processedMissions: 0 }, true)).toBe(false);
  });
  it("is graded as completed at the buzzer when the mission was already completed earlier", () => {
    expect(isGraded({ processedMissions: 0, missionsCompleted: true }, true)).toBe(true);
  });
  it("is not graded mid-game when there is nothing to process", () => {
    expect(isGraded({ processedMissions: 0, missionsCompleted: true }, false)).toBe(false);
  });
});
