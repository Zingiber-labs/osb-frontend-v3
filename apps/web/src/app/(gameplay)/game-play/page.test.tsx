import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const search = { current: new URLSearchParams() };
vi.mock("next/navigation", () => ({ useSearchParams: () => search.current }));
vi.mock("next/dynamic", () => ({ default: () => () => <div data-testid="gameplay-screen" /> }));

import GameplayPage from "./page";

describe("game-play page", () => {
  it("asks for a hangar pick when an id is not numeric", () => {
    search.current = new URLSearchParams("gameId=abc&playerId=12");
    render(<GameplayPage />);
    expect(screen.getByText("Pick a player in the hangar first.")).toBeInTheDocument();
    expect(screen.queryByTestId("gameplay-screen")).not.toBeInTheDocument();
  });
});
