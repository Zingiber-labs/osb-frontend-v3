import type { ShipAction } from "../engine/types";

export type ActionRunner = (action: ShipAction) => Promise<void>;
export type Waiter = (ms: number) => Promise<void>;

/**
 * Backlog cap. The queue only animates (state is already synced when actions are enqueued), so a late joiner's
 * catch-up burst must not leave the scene minutes behind the HUD: past this many pending actions the oldest are
 * dropped, except terminal ones, which always play.
 */
export const MAX_PENDING = 8;

const TERMINAL: ReadonlySet<ShipAction["type"]> = new Set(["objectiveComplete", "warpOut", "explode"]);

const defaultWait: Waiter = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class ActionQueue {
  private queue: ShipAction[] = [];
  private draining = false;
  private idleResolvers: Array<() => void> = [];
  private readonly run: ActionRunner;
  private readonly gapMs: number;
  private readonly wait: Waiter;

  constructor(run: ActionRunner, gapMs = 150, wait: Waiter = defaultWait) {
    this.run = run;
    this.gapMs = gapMs;
    this.wait = wait;
  }

  get pending(): number {
    return this.queue.length;
  }

  get busy(): boolean {
    return this.draining;
  }

  /** Snapshot of the actions waiting to run (the running one excluded). */
  pendingActions(): ShipAction[] {
    return [...this.queue];
  }

  enqueue(actions: ShipAction[]): void {
    this.queue.push(...actions);
    while (this.queue.length > MAX_PENDING) {
      const oldest = this.queue.findIndex((a) => !TERMINAL.has(a.type));
      if (oldest === -1) break;
      this.queue.splice(oldest, 1);
    }
    void this.drain();
  }

  /** Resolves once nothing is running or pending (after the last gap). */
  whenIdle(): Promise<void> {
    if (!this.draining && this.queue.length === 0) return Promise.resolve();
    return new Promise<void>((resolve) => { this.idleResolvers.push(resolve); });
  }

  clear(): void {
    this.queue = [];
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.queue.length > 0) {
        const action = this.queue.shift()!;
        try {
          await this.run(action);
        } catch (err) {
          console.warn("ship animation failed", action, err);
        }
        await this.wait(this.gapMs);
      }
    } finally {
      this.draining = false;
      const resolvers = this.idleResolvers;
      this.idleResolvers = [];
      for (const resolve of resolvers) resolve();
    }
  }
}
