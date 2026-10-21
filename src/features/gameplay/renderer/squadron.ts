import type { EnemySize } from "@/features/gameplay/engine/types";

export type MemberState = "entering" | "holding";

export type Member = {
  id: number;
  slot: number;
  size: EnemySize;
  state: MemberState;
  x: number;
  y: number;
  enterMs: number;
  elapsed: number;
  seed: number;
};

export type SquadronOptions = {
  width: number;
  height: number;
  slots?: number;
  respawnDelayMs?: number;
  enterMs?: number;
  fastEnterMs?: number;
  random?: () => number;
};

const SIZES: EnemySize[] = ["scout", "fighter", "cruiser"];
const OFFSCREEN_PAD = 80;

/**
 * Pure squadron state: which enemies exist, where they are, and when empty slots refill.
 * No Pixi here; SquadronView turns members into sprites.
 */
export class SquadronModel {
  readonly members: Member[] = [];
  private readonly width: number;
  private readonly height: number;
  private readonly slotCount: number;
  private readonly respawnDelayMs: number;
  private readonly enterMs: number;
  private readonly fastEnterMs: number;
  private readonly random: () => number;
  private readonly respawnAt = new Map<number, number>();
  private nextId = 1;
  private sizeIndex = 0;
  private clock = 0;

  constructor(opts: SquadronOptions) {
    this.width = opts.width;
    this.height = opts.height;
    this.slotCount = opts.slots ?? 3;
    this.respawnDelayMs = opts.respawnDelayMs ?? 600;
    this.enterMs = opts.enterMs ?? 1200;
    this.fastEnterMs = opts.fastEnterMs ?? 400;
    this.random = opts.random ?? Math.random;
    for (let slot = 0; slot < this.slotCount; slot += 1) this.spawn(slot);
  }

  anchor(slot: number): { x: number; y: number } {
    return { x: this.width * (0.76 + slot * 0.04), y: this.height * (0.3 + slot * 0.2) };
  }

  /** Precondition: callers spawn only after a removal; spawning into an occupied slot is not guarded. */
  spawn(slot: number, opts: { fast?: boolean } = {}): Member {
    const a = this.anchor(slot);
    const member: Member = {
      id: this.nextId++,
      slot,
      size: SIZES[this.sizeIndex++ % SIZES.length],
      state: "entering",
      x: this.width + OFFSCREEN_PAD,
      y: a.y,
      enterMs: opts.fast ? this.fastEnterMs : this.enterMs,
      elapsed: 0,
      seed: this.random() * Math.PI * 2,
    };
    this.members.push(member);
    this.respawnAt.delete(slot);
    return member;
  }

  update(dtMs: number): void {
    this.clock += dtMs;
    const startX = this.width + OFFSCREEN_PAD;
    for (const m of this.members) {
      m.elapsed += dtMs;
      const a = this.anchor(m.slot);
      if (m.state === "entering") {
        const t = Math.min(1, m.elapsed / m.enterMs);
        const eased = 1 - (1 - t) * (1 - t);
        m.x = startX + (a.x - startX) * eased;
        m.y = a.y;
        if (t >= 1) m.state = "holding";
      } else {
        m.x = a.x + Math.sin(this.clock / 1100 + m.seed) * 6;
        m.y = a.y + Math.sin(this.clock / 700 + m.seed) * 12;
      }
    }
    for (const [slot, at] of [...this.respawnAt]) {
      if (this.clock >= at) this.spawn(slot);
    }
  }

  takeNearest(x: number, y: number): Member | null {
    if (this.members.length === 0) return null;
    let best = this.members[0];
    let bestD = Infinity;
    for (const m of this.members) {
      const d = (m.x - x) ** 2 + (m.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    }
    this.remove(best);
    return best;
  }

  takeAny(): Member | null {
    const m = this.members.find((x) => x.state === "holding") ?? this.members[0];
    if (!m) return null;
    this.remove(m);
    return m;
  }

  pick(): Member | null {
    return this.members.find((m) => m.state === "holding") ?? this.members[0] ?? null;
  }

  /** First slot with no member; callers spawn only after a removal (falls back to 0 when all are full). */
  freeSlot(): number {
    for (let slot = 0; slot < this.slotCount; slot += 1) {
      if (!this.members.some((m) => m.slot === slot)) return slot;
    }
    return 0;
  }

  private remove(member: Member): void {
    const idx = this.members.indexOf(member);
    if (idx >= 0) this.members.splice(idx, 1);
    this.respawnAt.set(member.slot, this.clock + this.respawnDelayMs);
  }
}
