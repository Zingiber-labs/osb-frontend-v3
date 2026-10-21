import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testGame } from "@/features/gameplay/feeds/testGame";
import type { RecordedGame } from "@/features/gameplay/feeds/types";
import { SetupPanel } from "./SetupPanel";

const secondGame: RecordedGame = {
  ...testGame,
  id: "test-2",
  home: { id: "X", name: "X Team", abbreviation: "XXX", players: [{ id: "x1", name: "X One" }] },
  away: { id: "Y", name: "Y Team", abbreviation: "YYY", players: [{ id: "y1", name: "Y One" }] },
};
const games = [testGame, secondGame];

describe("SetupPanel", () => {
  afterEach(cleanup);

  it("submits the first roster player of a newly selected game", () => {
    const onStart = vi.fn();
    render(<SetupPanel games={games} onStart={onStart} />);
    fireEvent.change(screen.getByLabelText("Game"), { target: { value: "test-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ gameId: "test-2", playerId: "x1" }));
  });

  it("submits an explicitly chosen player", () => {
    const onStart = vi.fn();
    render(<SetupPanel games={games} onStart={onStart} />);
    fireEvent.change(screen.getByLabelText("Player"), { target: { value: "a2" } });
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ gameId: "test-1", playerId: "a2" }));
  });

  it("uses the initial game and player from props when present", () => {
    const onStart = vi.fn();
    render(<SetupPanel games={games} initialGameId="test-2" initialPlayerId="y1" onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ gameId: "test-2", playerId: "y1" }));
  });
});
