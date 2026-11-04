import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
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
    whenIdle = () => Promise.resolve();
  },
}));

// The renderer module loads through a real dynamic import, which fake timers do not drive. Wait on the real clock.
const realSetTimeout = globalThis.setTimeout;
const rendererReady = () =>
  act(async () => {
    await new Promise<void>((resolve) => realSetTimeout(resolve, 50));
  });

describe("GamePlayPage", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts a replay from the setup panel and runs it to a result", async () => {
    const game = games[0];
    const player = game.home.players[0];

    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/game-play"]}>
          <GamePlayPage />
        </MemoryRouter>
      </StrictMode>,
    );

    expect(screen.getByRole("heading", { name: /game play/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/player/i), { target: { value: player.id } });
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/speed/i), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    // The renderer module loads through a real dynamic import; let it settle so the feed can start.
    await rendererReady();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole("progressbar", { name: /hull/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exit/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /fire scout|pause|step/i })).toBeNull();
    // The mission card announces the target at tip-off.
    expect(screen.getByText(/1 PTS · /)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.getByText(/mission (success|failed)/i)).toBeInTheDocument();
    expect(syncState).toHaveBeenCalled();
    const last = game.plays[game.plays.length - 1];
    expect(screen.getByTestId("score").textContent).toBe(
      `${game.home.abbreviation} ${last.homeScore} - ${last.awayScore} ${game.away.abbreviation}`,
    );

    // Replay restarts the same game in place: result gone, HUD back, canvas remounted.
    fireEvent.click(screen.getByRole("button", { name: /^replay$/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.queryByText(/mission (success|failed)/i)).toBeNull();
    expect(screen.getByRole("progressbar", { name: /hull/i })).toHaveAttribute("aria-valuenow", "100");

    // Exit returns to the setup panel.
    fireEvent.click(screen.getByRole("button", { name: /exit/i }));
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("shows an error when the URL points at a game that is not recorded", () => {
    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/game-play?gameId=nope&playerId=x"]}>
          <GamePlayPage />
        </MemoryRouter>
      </StrictMode>,
    );
    expect(screen.getByText(/no recorded game with id "nope"/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("offers Back to setup on the result screen", async () => {
    const game = games[0];
    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/game-play"]}>
          <GamePlayPage />
        </MemoryRouter>
      </StrictMode>,
    );
    fireEvent.change(screen.getByLabelText(/player/i), { target: { value: game.home.players[0].id } });
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/speed/i), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    await rendererReady();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(63_000);
    });
    fireEvent.click(screen.getByRole("button", { name: /back to setup/i }));
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });
});
