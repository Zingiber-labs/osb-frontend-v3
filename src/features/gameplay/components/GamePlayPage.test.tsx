import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { games } from "@/fixtures/games";
import { GamePlayPage } from "./GamePlayPage";

const enqueue = vi.fn();
const syncState = vi.fn();

vi.mock("@/features/gameplay/renderer/ScenarioRenderer", () => ({
  ScenarioRenderer: class {
    mount = vi.fn(() => Promise.resolve());
    destroy = vi.fn();
    enqueue = enqueue;
    syncState = syncState;
  },
}));

describe("GamePlayPage", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts a replay from the setup panel and runs it to a result", async () => {
    const game = games[0];
    const player = game.home.players[0];

    render(
      <MemoryRouter initialEntries={["/game-play"]}>
        <GamePlayPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /game play/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/player/i), { target: { value: player.id } });
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/speed/i), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole("progressbar", { name: /hull/i })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(screen.getByText(/mission (success|failed)/i)).toBeInTheDocument();
    expect(syncState).toHaveBeenCalled();
    const last = game.plays[game.plays.length - 1];
    expect(screen.getByTestId("score").textContent).toBe(
      `${game.home.abbreviation} ${last.homeScore} - ${last.awayScore} ${game.away.abbreviation}`,
    );
  });

  it("shows an error when the URL points at a game that is not recorded", () => {
    render(
      <MemoryRouter initialEntries={["/game-play?gameId=nope&playerId=x"]}>
        <GamePlayPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no recorded game with id "nope"/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });
});
