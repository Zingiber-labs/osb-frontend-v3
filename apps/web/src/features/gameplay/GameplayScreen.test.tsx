import { render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push }) }));
vi.mock("@/hooks/useSession", () => ({ useSession: () => ({ data: { id: "u1" } }) }));

const gameFeed = vi.fn();
vi.mock("./useGameFeed", () => ({ useGameFeed: () => gameFeed() }));
vi.mock("./useMissionGrading", () => ({ useMissionGrading: () => undefined }));

const canvasCallsReady = { current: false };
vi.mock("@osb/gameplay", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@osb/gameplay")>();
  function ScenarioCanvas({ onReady }: { onReady: (r: typeof actual.NULL_RENDERER) => void }) {
    useEffect(() => {
      if (canvasCallsReady.current) onReady(actual.NULL_RENDERER);
    }, [onReady]);
    return <div data-testid="canvas" />;
  }
  return { ...actual, ScenarioCanvas };
});

const activeMission = vi.fn();
vi.mock("./useActiveMission", () => ({ useActiveMission: () => activeMission() }));

import { GameplayScreen } from "./GameplayScreen";

const pointsMission = { data: { id: "m", missionId: "1", isCompleted: false, isClaimed: false, mission: { id: 1, name: "Score", requirements: { points: 10 }, rewards: { xp: 5 } } }, isPending: false, isFetching: false };

describe("GameplayScreen", () => {
  beforeEach(() => {
    replace.mockClear();
    push.mockClear();
    canvasCallsReady.current = false;
    gameFeed.mockReturnValue({ feed: null, game: null, myPlayerId: "p1", mode: "live" });
  });

  it("redirects to /missions when the user has no active mission", async () => {
    activeMission.mockReturnValue({ data: null, isPending: false, isFetching: false });
    render(<GameplayScreen gameId="1" playerId="p1" />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/missions"));
  });

  it("explains an unsupported mission instead of starting", () => {
    activeMission.mockReturnValue({ data: { id: "m", missionId: "1", isCompleted: false, isClaimed: false, mission: { id: 1, name: "Dimes", requirements: { assists: 5 }, rewards: {} } }, isPending: false, isFetching: false });
    render(<GameplayScreen gameId="1" playerId="p1" />);
    expect(screen.getByText(/not supported/i)).toBeInTheDocument();
    expect(screen.queryByTestId("canvas")).not.toBeInTheDocument();
  });

  it("shows a connecting state until the game header arrives", () => {
    activeMission.mockReturnValue(pointsMission);
    render(<GameplayScreen gameId="1" playerId="p1" />);
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    expect(screen.getByTestId("canvas")).toBeInTheDocument();
  });

  it("starts the feed once the renderer is ready, before the game header arrives", async () => {
    const fakeFeed = { start: vi.fn(), stop: vi.fn(), pause: vi.fn(), step: vi.fn(), onEvent: vi.fn(() => () => {}) };
    gameFeed.mockReturnValue({ feed: fakeFeed, game: null, myPlayerId: "p1", mode: "live" });
    canvasCallsReady.current = true;
    activeMission.mockReturnValue(pointsMission);
    render(<GameplayScreen gameId="1" playerId="p1" />);
    await waitFor(() => expect(fakeFeed.start).toHaveBeenCalledTimes(1));
    expect(fakeFeed.onEvent).toHaveBeenCalled();
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
  });

  it("explains a failed mission load instead of connecting forever", () => {
    activeMission.mockReturnValue({ data: undefined, isPending: false, isFetching: false, isError: true });
    render(<GameplayScreen gameId="1" playerId="p1" />);
    expect(screen.getByRole("heading", { name: /mission control unavailable/i })).toBeInTheDocument();
    expect(screen.getByText("We could not load your active mission.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Missions" })).toHaveAttribute("href", "/missions");
    expect(screen.queryByText(/connecting/i)).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not redirect while a stale null is being refetched", async () => {
    activeMission.mockReturnValue({ data: null, isPending: false, isFetching: true });
    render(<GameplayScreen gameId="1" playerId="p1" />);
    await new Promise((r) => setTimeout(r, 50));
    expect(replace).not.toHaveBeenCalled();
  });
});
