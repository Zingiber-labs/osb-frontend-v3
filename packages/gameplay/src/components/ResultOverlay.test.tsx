import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../engine/reduce";
import type { ScenarioState } from "../engine/types";
import { ResultOverlay } from "./ResultOverlay";

const mission = { stat: "pts" as const, target: 10 };
const won: ScenarioState = { ...createInitialState(mission), status: "won", myPlayerStats: { pts: 12, blk: 0, stl: 1, tov: 0 } };

describe("ResultOverlay", () => {
  it("shows the engine verdict and the primary action", async () => {
    const onClick = vi.fn();
    render(<ResultOverlay state={won} mission={mission} primaryAction={{ label: "Back to hangar", onClick }} />);
    expect(screen.getByRole("heading", { name: /mission success/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /back to hangar/i }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByText(/grading/i)).not.toBeInTheDocument();
  });

  it("shows a grading state while the backend has not answered", () => {
    render(<ResultOverlay state={won} mission={mission} grading={{ status: "grading" }} primaryAction={{ label: "Exit", onClick: () => {} }} />);
    expect(screen.getByText(/grading mission/i)).toBeInTheDocument();
  });

  it("shows rewards once graded as completed", () => {
    render(
      <ResultOverlay state={won} mission={mission} grading={{ status: "graded", completed: true, rewards: { xp: 50, gems: 2 } }} primaryAction={{ label: "Exit", onClick: () => {} }} />,
    );
    expect(screen.getByText("+50 XP")).toBeInTheDocument();
    expect(screen.getByText("+2 GEMS")).toBeInTheDocument();
  });

  it("shows the backend verdict when it disagrees with the engine", () => {
    render(<ResultOverlay state={won} mission={mission} grading={{ status: "graded", completed: false }} primaryAction={{ label: "Exit", onClick: () => {} }} />);
    expect(screen.getByText(/not credited/i)).toBeInTheDocument();
  });
});
