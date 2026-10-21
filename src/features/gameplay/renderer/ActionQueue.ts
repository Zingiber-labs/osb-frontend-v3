import type { ShipAction } from "@/features/gameplay/engine/types";

export type ActionRunner = (action: ShipAction) => Promise<void>;
export type Waiter = (ms: number) => Promise<void>;

const defaultWait: Waiter = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class ActionQueue {
  private queue: ShipAction[] = [];
  private draining = false;
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

  enqueue(actions: ShipAction[]): void {
    this.queue.push(...actions);
    void this.drain();
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
    }
  }
}
