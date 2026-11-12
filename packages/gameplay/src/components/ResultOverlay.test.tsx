import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../engine/reduce";
import type { MissionConfig, ScenarioState } from "../engine/types";
import { ResultOverlay } from "./ResultOverlay";

const mission: MissionConfig = { stat: "pts", target: 20 };

function setup(overrides: Partial<ScenarioState>) {
  const base = createInitialState(mission);
  const state: ScenarioState = { ...base, ...overrides };
  const onReplay = vi.fn();
  const onExit = vi.fn();
  render(<ResultOverlay state={state} mission={mission} onReplay={onReplay} onExit={onExit} />);
  return { onReplay, onExit };
}

describe("ResultOverlay", () => {
  it("shows success in the mine color with the mission line", () => {
    setup({ status: "won", myPlayerStats: { pts: 17, blk: 0, stl: 0, tov: 0 } });
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    const title = screen.getByRole("heading", { name: "MISSION SUCCESS" });
    expect(title).toHaveClass("text-hud-mine");
    expect(screen.getByRole("dialog")).toHaveAccessibleName("MISSION SUCCESS");
    expect(screen.getByText(/17 \/ 20 PTS/)).toBeInTheDocument();
  });

  it("shows failure in the theirs color", () => {
    setup({ status: "lost" });
    expect(screen.getByRole("heading", { name: "MISSION FAILED" })).toHaveClass("text-hud-theirs");
  });

  it("wires Replay and Back to setup", () => {
    const { onReplay, onExit } = setup({ status: "won" });
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to setup" }));
    expect(onReplay).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
