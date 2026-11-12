import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push }) }));
vi.mock("@/hooks/useSession", () => ({ useSession: () => ({ data: { id: "u1" } }) }));
vi.mock("./useGameFeed", () => ({ useGameFeed: () => ({ feed: null, game: null, myPlayerId: "p1", mode: "live" }) }));
vi.mock("./useMissionGrading", () => ({ useMissionGrading: () => undefined }));
vi.mock("@osb/gameplay", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@osb/gameplay")>();
  return { ...actual, ScenarioCanvas: () => <div data-testid="canvas" /> };
});

const activeMission = vi.fn();
vi.mock("./useActiveMission", () => ({ useActiveMission: () => activeMission() }));

import { GameplayScreen } from "./GameplayScreen";

describe("GameplayScreen", () => {
  it("redirects to /missions when the user has no active mission", async () => {
    activeMission.mockReturnValue({ data: null, isPending: false });
    render(<GameplayScreen gameId="1" playerId="p1" />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/missions"));
  });

  it("explains an unsupported mission instead of starting", () => {
    activeMission.mockReturnValue({ data: { id: "m", missionId: "1", isCompleted: false, isClaimed: false, mission: { id: 1, name: "Dimes", requirements: { assists: 5 }, rewards: {} } }, isPending: false });
    render(<GameplayScreen gameId="1" playerId="p1" />);
    expect(screen.getByText(/not supported/i)).toBeInTheDocument();
    expect(screen.queryByTestId("canvas")).not.toBeInTheDocument();
  });

  it("shows a connecting state until the game header arrives", () => {
    activeMission.mockReturnValue({ data: { id: "m", missionId: "1", isCompleted: false, isClaimed: false, mission: { id: 1, name: "Score", requirements: { points: 10 }, rewards: { xp: 5 } } }, isPending: false });
    render(<GameplayScreen gameId="1" playerId="p1" />);
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    expect(screen.getByTestId("canvas")).toBeInTheDocument();
  });
});
