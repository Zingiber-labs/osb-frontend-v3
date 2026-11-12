import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, type Mock } from "vitest";
import { at } from "@/features/gameplay/engine/testUtils";
import { createTestFeed } from "@/features/gameplay/feeds/testFeed";
import type { RendererPort } from "@/features/gameplay/renderer/RendererPort";
import { useScenario } from "./useScenario";

function mockRenderer(): RendererPort & { enqueue: Mock<RendererPort["enqueue"]>; syncState: Mock<RendererPort["syncState"]> } {
  return { enqueue: vi.fn<RendererPort["enqueue"]>(), syncState: vi.fn<RendererPort["syncState"]>(), whenIdle: () => Promise.resolve() };
}

const mission = { stat: "pts" as const, target: 5 };

describe("useScenario", () => {
  it("returns the initial state before any event", () => {
    const { result } = renderHook(() => useScenario(null, mission, null));
    expect(result.current.hull).toBe(100);
    expect(result.current.status).toBe("pending");
  });

  it("reduces feed events, forwards actions and state to the renderer", () => {
    const feed = createTestFeed();
    const renderer = mockRenderer();
    const { result } = renderHook(() => useScenario(feed, mission, renderer));

    act(() => feed.emit({ kind: "score", side: "theirs", points: 3, byMyPlayer: false, at: at({ away: 3 }) }));

    expect(result.current.hull).toBe(94);
    expect(renderer.enqueue).toHaveBeenCalledWith([{ type: "hit", points: 3, absorbed: false }]);
    expect(renderer.syncState).toHaveBeenLastCalledWith(expect.objectContaining({ hull: 94 }));
  });

  it("works without a renderer and picks one up later", () => {
    const feed = createTestFeed();
    const renderer = mockRenderer();
    const { result, rerender } = renderHook(({ r }) => useScenario(feed, mission, r), { initialProps: { r: null as RendererPort | null } });

    act(() => feed.emit({ kind: "score", side: "mine", points: 2, byMyPlayer: true, at: at() }));
    expect(result.current.myPlayerStats.pts).toBe(2);

    rerender({ r: renderer });
    act(() => feed.emit({ kind: "score", side: "mine", points: 3, byMyPlayer: true, at: at() }));
    expect(renderer.enqueue).toHaveBeenCalledWith([{ type: "fire", size: "cruiser", charged: true }, { type: "objectiveComplete" }]);
  });

  it("resets when the feed changes and unsubscribes from the old one", () => {
    const first = createTestFeed();
    const second = createTestFeed();
    const renderer = mockRenderer();
    const { result, rerender } = renderHook(({ f }) => useScenario(f, mission, renderer), { initialProps: { f: first } });

    act(() => first.emit({ kind: "score", side: "theirs", points: 2, byMyPlayer: false, at: at() }));
    expect(result.current.hull).toBe(96);

    rerender({ f: second });
    expect(result.current.hull).toBe(100);

    act(() => first.emit({ kind: "score", side: "theirs", points: 2, byMyPlayer: false, at: at() }));
    expect(result.current.hull).toBe(100);

    act(() => second.emit({ kind: "score", side: "theirs", points: 1, byMyPlayer: false, at: at() }));
    expect(result.current.hull).toBe(98);
  });
});
