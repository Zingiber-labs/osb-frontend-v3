import { describe, expect, it, vi } from "vitest";
import type { ShipAction } from "../engine/types";
import { ActionQueue } from "./ActionQueue";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => { resolve = r; });
  return { promise, resolve };
}

const fire: ShipAction = { type: "fire", size: "scout", charged: false };
const stall: ShipAction = { type: "stall" };
const hit: ShipAction = { type: "hit", points: 2, absorbed: false };

describe("ActionQueue", () => {
  it("runs actions one at a time in order with a gap between them", async () => {
    const started: ShipAction[] = [];
    const pending: ReturnType<typeof deferred>[] = [];
    const run = vi.fn((a: ShipAction) => { started.push(a); const d = deferred(); pending.push(d); return d.promise; });
    const waits: ReturnType<typeof deferred>[] = [];
    const wait = vi.fn((_ms: number) => { const d = deferred(); waits.push(d); return d.promise; });

    const q = new ActionQueue(run, 150, wait);
    q.enqueue([fire, stall, hit]);
    await Promise.resolve();

    expect(started).toEqual([fire]);
    expect(q.pending).toBe(2);
    expect(q.busy).toBe(true);

    pending[0].resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(wait).toHaveBeenCalledWith(150);
    expect(started).toEqual([fire]);

    waits[0].resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(started).toEqual([fire, stall]);

    pending[1].resolve();
    await Promise.resolve();
    await Promise.resolve();
    waits[1].resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(started).toEqual([fire, stall, hit]);

    pending[2].resolve();
    await Promise.resolve();
    await Promise.resolve();
    waits[2].resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(q.busy).toBe(false);
    expect(q.pending).toBe(0);
  });

  it("keeps draining when one animation rejects", async () => {
    const seen: string[] = [];
    const run = vi.fn(async (a: ShipAction) => { seen.push(a.type); if (a.type === "fire") throw new Error("boom"); });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const q = new ActionQueue(run, 0, async () => {});
    q.enqueue([fire, stall]);
    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toEqual(["fire", "stall"]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("appends actions enqueued while draining and clear drops the rest", async () => {
    const seen: string[] = [];
    const first = deferred();
    const run = vi.fn((a: ShipAction) => { seen.push(a.type); return a.type === "fire" ? first.promise : Promise.resolve(); });
    const q = new ActionQueue(run, 0, async () => {});
    q.enqueue([fire]);
    q.enqueue([stall, hit]);
    expect(q.pending).toBe(2);
    q.clear();
    expect(q.pending).toBe(0);
    first.resolve();
    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toEqual(["fire"]);
  });

  it("whenIdle resolves immediately when nothing is queued", async () => {
    const q = new ActionQueue(async () => {}, 0, async () => {});
    await expect(q.whenIdle()).resolves.toBeUndefined();
  });

  it("whenIdle resolves only after the last action and its gap complete", async () => {
    const running = deferred();
    const gap = deferred();
    const q = new ActionQueue(() => running.promise, 150, () => gap.promise);
    q.enqueue([fire]);
    let idle = false;
    void q.whenIdle().then(() => { idle = true; });
    await Promise.resolve();
    expect(idle).toBe(false);

    running.resolve();
    await new Promise((r) => setTimeout(r, 0));
    expect(idle).toBe(false);

    gap.resolve();
    await new Promise((r) => setTimeout(r, 0));
    expect(idle).toBe(true);
  });
});
