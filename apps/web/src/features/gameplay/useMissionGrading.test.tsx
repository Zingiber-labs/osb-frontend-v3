import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as apiModule from "./api";
import { useMissionGrading, type GradingInput } from "./useMissionGrading";

// GRADING_INTERVAL_MS is read at module load, so the env must be stubbed before the hook module is imported.
vi.hoisted(() => {
  vi.stubEnv("GAMEPLAY_GRADING_INTERVAL_MS", "20");
});
afterAll(() => vi.unstubAllEnvs());

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof apiModule>();
  return { ...actual, processGame: vi.fn() };
});

const processGame = vi.mocked(apiModule.processGame);

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const base: GradingInput = {
  userId: "u1", gameId: "21718083", playerId: "1091465698",
  stats: { pts: 12, blk: 1, stl: 3, tov: 2 },
  finished: false, engineWon: false, rewards: { xp: 50, gems: 1 }, enabled: true,
};

describe("useMissionGrading", () => {
  beforeEach(() => { processGame.mockReset(); });

  it("posts the engine stats and returns nothing to show before the game ends", async () => {
    processGame.mockResolvedValue({ processedMissions: 1, missionsCompleted: false });
    const { result } = renderHook(() => useMissionGrading(base), { wrapper });
    await waitFor(() => expect(processGame).toHaveBeenCalled());
    expect(processGame).toHaveBeenCalledWith({ userId: "u1", idGame: 21718083, idPlayer: 1091465698, points: 12, rebounds: 0, blocks: 1, assists: 0, steals: 3, isGameFinished: false });
    expect(result.current).toBeUndefined();
  });

  it("shows grading once finished and not yet graded, then graded with rewards", async () => {
    processGame.mockResolvedValueOnce({ processedMissions: 0 }).mockResolvedValue({ processedMissions: 1, missionsCompleted: true });
    const { result, rerender } = renderHook((props: GradingInput) => useMissionGrading(props), { wrapper, initialProps: base });
    await waitFor(() => expect(processGame).toHaveBeenCalledTimes(1));
    rerender({ ...base, finished: true, engineWon: true });
    await waitFor(() => expect(result.current).toEqual({ status: "grading" }));
    await waitFor(() => expect(result.current).toEqual({ status: "graded", completed: true, rewards: { xp: 50, gems: 1 } }), { timeout: 7000 });
  }, 10000);

  it("reports the backend verdict and warns when it disagrees with the engine", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    processGame.mockResolvedValue({ processedMissions: 1, missionsCompleted: false });
    const { result } = renderHook(() => useMissionGrading({ ...base, finished: true, engineWon: true }), { wrapper });
    await waitFor(() => expect(result.current).toEqual({ status: "graded", completed: false }));
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/disagree/i), expect.anything());
    warn.mockRestore();
  });

  it("does nothing while disabled or without a user", async () => {
    renderHook(() => useMissionGrading({ ...base, enabled: false }), { wrapper });
    renderHook(() => useMissionGrading({ ...base, userId: undefined }), { wrapper });
    await new Promise((r) => setTimeout(r, 50));
    expect(processGame).not.toHaveBeenCalled();
  });
});
