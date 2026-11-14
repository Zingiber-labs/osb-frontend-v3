import type { EnemySize } from "../engine/types";
import { DEFAULT_VIEW, project, type Vec3, type View } from "./projection";

export type MemberState = "entering" | "holding";

export type Member = Vec3 & {
  id: number;
  slot: number;
  size: EnemySize;
  state: MemberState;
  enterMs: number;
  elapsed: number;
  seed: number;
};

export type SquadronOptions = {
  slots?: number;
  respawnDelayMs?: number;
  enterMs?: number;
  fastEnterMs?: number;
  view?: View;
  random?: () => number;
};

const SIZES: EnemySize[] = ["scout", "fighter", "cruiser"];
/** Depth a new member starts from: far enough to be a dot. */
export const ENTER_Z = 3600;
/** Slot anchors in world units: a loose V ahead of the ship at three depths. */
const ANCHORS: Vec3[] = [
  { x: -420, y: -60, z: 1000 },
  { x: 0, y: -120, z: 1400 },
  { x: 440, y: -40, z: 1100 },
];
const WOBBLE_X = 25;
const WOBBLE_Y = 40;

/**
 * Pure squadron state: which enemies exist, where they are in world space, and when empty slots
 * refill. No Pixi here; SquadronView projects members into sprites.
 */
export class SquadronModel {
  readonly members: Member[] = [];
  private readonly slotCount: number;
  private readonly respawnDelayMs: number;
  private readonly enterMs: number;
  private readonly fastEnterMs: number;
  private readonly view: View;
  private readonly random: () => number;
  private readonly respawnAt = new Map<number, number>();
  private nextId = 1;
  private sizeIndex = 0;
  private clock = 0;

  constructor(opts: SquadronOptions = {}) {
    this.slotCount = opts.slots ?? 3;
    this.respawnDelayMs = opts.respawnDelayMs ?? 600;
    this.enterMs = opts.enterMs ?? 1200;
    this.fastEnterMs = opts.fastEnterMs ?? 400;
    this.view = opts.view ?? DEFAULT_VIEW;
    this.random = opts.random ?? Math.random;
    for (let slot = 0; slot < this.slotCount; slot += 1) this.spawn(slot);
  }

  anchor(slot: number): Vec3 {
    const a = ANCHORS[slot % ANCHORS.length];
    return { x: a.x, y: a.y, z: a.z };
  }

  /** Precondition: callers spawn only after a removal; spawning into an occupied slot is not guarded. */
  spawn(slot: number, opts: { fast?: boolean } = {}): Member {
    const a = this.anchor(slot);
    const member: Member = {
      id: this.nextId++,
      slot,
      size: SIZES[this.sizeIndex++ % SIZES.length],
      state: "entering",
      x: a.x,
      y: a.y,
      z: ENTER_Z,
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
    for (const m of this.members) {
      m.elapsed += dtMs;
      const a = this.anchor(m.slot);
      if (m.state === "entering") {
        const t = Math.min(1, m.elapsed / m.enterMs);
        const eased = 1 - (1 - t) * (1 - t);
        m.x = a.x;
        m.y = a.y;
        m.z = ENTER_Z + (a.z - ENTER_Z) * eased;
        if (t >= 1) m.state = "holding";
      } else {
        m.x = a.x + Math.sin(this.clock / 1100 + m.seed) * WOBBLE_X;
        m.y = a.y + Math.sin(this.clock / 700 + m.seed) * WOBBLE_Y;
        m.z = a.z;
      }
    }
    for (const [slot, at] of [...this.respawnAt]) {
      if (this.clock >= at) this.spawn(slot);
    }
  }

  /** Removes and returns the member whose projection is closest to a screen point. */
  takeNearest(sx: number, sy: number): Member | null {
    if (this.members.length === 0) return null;
    // Prefer visible (holding) enemies; a just-respawned far dot is only a fallback.
    const holding = this.members.filter((m) => m.state === "holding");
    const pool = holding.length > 0 ? holding : this.members;
    let best = pool[0];
    let bestD = Infinity;
    for (const m of pool) {
      const p = project(m, this.view);
      const d = (p.sx - sx) ** 2 + (p.sy - sy) ** 2;
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
