import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { games } from "@/fixtures/games";
import { ClockPanel } from "./ClockPanel";
import { CountersPanel } from "./CountersPanel";
import { ScorePanel } from "./ScorePanel";
import { StatusPanel } from "./StatusPanel";
import { useFlashOnChange } from "./useFlashOnChange";

const game = games[0];

describe("useFlashOnChange", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is false initially, true right after a change, false 300 ms later", () => {
    const { result, rerender } = renderHook(({ v }) => useFlashOnChange(v), { initialProps: { v: 1 } });
    expect(result.current).toBe(false);
    rerender({ v: 2 });
    expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe(false);
  });
});

describe("ClockPanel", () => {
  it("shows period, clock and a working exit button", () => {
    const onExit = vi.fn();
    render(<ClockPanel clock={{ period: 5, secondsLeft: 65, home: 0, away: 0 }} onExit={onExit} />);
    expect(screen.getByText("OT1")).toBeInTheDocument();
    expect(screen.getByText("1:05")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /exit/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

describe("ScorePanel", () => {
  it("keeps the score text contract and colors my team", () => {
    render(<ScorePanel clock={{ period: 1, secondsLeft: 700, home: 48, away: 52 }} game={game} myTeamId={game.away.id} stats={{ pts: 12, blk: 1, stl: 2, tov: 3 }} />);
    expect(screen.getByTestId("score").textContent).toBe(`${game.home.abbreviation} 48 - 52 ${game.away.abbreviation}`);
    expect(screen.getByText(game.away.abbreviation).closest("span")).toHaveClass("text-hud-mine");
    expect(screen.getByText(game.home.abbreviation).closest("span")).not.toHaveClass("text-hud-mine");
    expect(screen.getByText(/PTS 12/)).toBeInTheDocument();
    expect(screen.getByText(/TOV 3/)).toBeInTheDocument();
  });
});

describe("StatusPanel", () => {
  it("renders hull and shield bars and flags a low hull", () => {
    const { container } = render(<StatusPanel hull={20} shield={2} />);
    expect(screen.getByRole("progressbar", { name: "hull" })).toHaveAttribute("aria-valuenow", "20");
    expect(screen.getByRole("progressbar", { name: "shield" })).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByRole("progressbar", { name: "hull" })).toHaveAttribute("data-low", "true");
    expect(container.querySelectorAll('[data-filled="true"]').length).toBe(4 + 2);
  });

  it("does not flag a healthy hull", () => {
    render(<StatusPanel hull={25} shield={0} />);
    expect(screen.getByRole("progressbar", { name: "hull" })).toHaveAttribute("data-low", "false");
  });
});

describe("CountersPanel", () => {
  it("shows kills and combo", () => {
    render(<CountersPanel kills={7} combo={3} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("x3")).toBeInTheDocument();
  });
});
