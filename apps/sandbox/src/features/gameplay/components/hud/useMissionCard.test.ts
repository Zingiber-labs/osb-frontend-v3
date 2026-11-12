import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/features/gameplay/engine/reduce";
import type { ScenarioState } from "@/features/gameplay/engine/types";
import { EVENT_MS, TIPOFF_MS } from "./missionCardRules";
import { useMissionCard } from "./useMissionCard";

const ctx = { playerName: "Ja Morant", matchup: "MEM vs IND" };
const initial = createInitialState({ stat: "pts", target: 20 });

describe("useMissionCard", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows nothing at first, the mission card at tip-off, then hides it after its duration", () => {
    const { result, rerender } = renderHook(({ state }) => useMissionCard(state, ctx), { initialProps: { state: initial } });
    expect(result.current).toBeNull();
    rerender({ state: { ...initial, status: "live" } });
    expect(result.current?.headline).toBe("20 PTS · JA MORANT");
    act(() => vi.advanceTimersByTime(TIPOFF_MS - 1));
    expect(result.current).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBeNull();
  });

  it("replaces a visible card with a newer one and restarts the timer", () => {
    const live: ScenarioState = { ...initial, status: "live" };
    const { result, rerender } = renderHook(({ state }) => useMissionCard(state, ctx), { initialProps: { state: initial } });
    rerender({ state: live });
    act(() => vi.advanceTimersByTime(1000));
    rerender({ state: { ...live, mission: { ...live.mission, met: true }, myPlayerStats: { pts: 20, blk: 0, stl: 0, tov: 0 } } });
    expect(result.current?.headline).toBe("OBJECTIVE COMPLETE");
    act(() => vi.advanceTimersByTime(EVENT_MS - 1));
    expect(result.current?.headline).toBe("OBJECTIVE COMPLETE");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBeNull();
  });
});
