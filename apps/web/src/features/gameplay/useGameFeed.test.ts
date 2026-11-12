import { act, renderHook } from "@testing-library/react";
import { games } from "@osb/gameplay";
import { describe, expect, it, vi } from "vitest";
import { SOCKET_EVENTS } from "./liveFeed";
import { feedMode, useGameFeed } from "./useGameFeed";

describe("feedMode", () => {
  it("is replay only when the env switch says so", () => {
    expect(feedMode("replay")).toBe("replay");
    expect(feedMode(undefined)).toBe("live");
    expect(feedMode("live")).toBe("live");
  });
});

describe("useGameFeed (live)", () => {
  it("connects once, exposes the header when it arrives, and disconnects on unmount", () => {
    const handlers = new Map<string, (p: any) => void>();
    const socket = {
      connected: true,
      emit: vi.fn(),
      on: vi.fn((e: string, cb: (p: any) => void) => { handlers.set(e, cb); }),
      off: vi.fn(),
      disconnect: vi.fn(),
    };
    const connect = vi.fn(() => socket);
    const { result, unmount } = renderHook(() => useGameFeed("1", "h1", connect));
    expect(connect).toHaveBeenCalledOnce();
    expect(result.current.mode).toBe("live");
    expect(result.current.game).toBeNull();
    expect(result.current.feed).not.toBeNull();
    // the live feed attaches its socket handlers on start()
    act(() => {
      result.current.feed!.start();
    });
    act(() => {
      handlers.get(SOCKET_EVENTS.gameInfo)?.({
        id: "1", date: "d",
        home: { id: "H", name: "H", abbreviation: "HOM", players: [{ id: "h1", name: "Home One" }] },
        away: { id: "A", name: "A", abbreviation: "AWY", players: [] },
      });
    });
    expect(result.current.game?.home.abbreviation).toBe("HOM");
    unmount();
    expect(socket.disconnect).toHaveBeenCalledOnce();
  });
});

describe("useGameFeed (replay)", () => {
  it("uses the first recorded game and one of its home players, ignoring the url ids", () => {
    vi.stubEnv("NEXT_PUBLIC_GAMEPLAY_FEED", "replay");
    const connect = vi.fn();
    const { result } = renderHook(() => useGameFeed("999", "nobody", connect));
    expect(connect).not.toHaveBeenCalled();
    expect(result.current.mode).toBe("replay");
    expect(result.current.game?.id).toBe(games[0].id);
    expect(result.current.myPlayerId).toBe(games[0].home.players[0].id);
    expect(result.current.feed).not.toBeNull();
    vi.unstubAllEnvs();
  });
});
