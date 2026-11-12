import { DEFAULT_VIEW, DESIGN, project, type Vec3, type View } from "./projection";

export type Star = Vec3 & { near: boolean; speed: number };

export type StarfieldOptions = {
  far?: number;
  near?: number;
  zNear?: number;
  zFar?: number;
  spreadX?: number;
  spreadY?: number;
  unitsPerMs?: number;
  view?: View;
  random?: () => number;
};

const MARGIN = 40;
/** Keeps respawned stars out of a small square around the centre line, in world units. */
const CENTER_GAP = 120;

/** Points with depth streaming toward the camera. Pure: StarfieldView draws it. */
export class StarfieldModel {
  readonly stars: Star[] = [];
  warp = 1;
  private readonly zNear: number;
  private readonly zFar: number;
  private readonly spreadX: number;
  private readonly spreadY: number;
  readonly unitsPerMs: number;
  private readonly view: View;
  private readonly random: () => number;

  constructor(opts: StarfieldOptions = {}) {
    this.zNear = opts.zNear ?? 60;
    this.zFar = opts.zFar ?? 4000;
    this.spreadX = opts.spreadX ?? 2600;
    this.spreadY = opts.spreadY ?? 1600;
    this.unitsPerMs = opts.unitsPerMs ?? 1.1;
    this.view = opts.view ?? DEFAULT_VIEW;
    this.random = opts.random ?? Math.random;
    const far = opts.far ?? 150;
    const near = opts.near ?? 40;
    for (let i = 0; i < far + near; i += 1) {
      const star: Star = { x: 0, y: 0, z: 0, near: i >= far, speed: 0.8 + this.random() * 0.4 };
      this.respawn(star);
      // Initial fill: spread through the whole depth range instead of all starting far away.
      star.z = this.zNear + this.random() * (this.zFar - this.zNear);
      this.stars.push(star);
    }
  }

  respawn(star: Star): void {
    let x = (this.random() * 2 - 1) * this.spreadX;
    let y = (this.random() * 2 - 1) * this.spreadY;
    if (Math.abs(x) < CENTER_GAP && Math.abs(y) < CENTER_GAP) {
      x = x >= 0 ? CENTER_GAP : -CENTER_GAP;
      y = y >= 0 ? CENTER_GAP : -CENTER_GAP;
    }
    star.x = x;
    star.y = y;
    star.z = this.zFar * (0.8 + this.random() * 0.2);
  }

  update(dtMs: number): void {
    const step = this.unitsPerMs * this.warp * dtMs;
    for (const st of this.stars) {
      st.z -= step * st.speed;
      if (st.z < this.zNear) {
        this.respawn(st);
        continue;
      }
      const p = project(st, this.view);
      if (p.sx < -MARGIN || p.sx > DESIGN.width + MARGIN || p.sy < -MARGIN || p.sy > DESIGN.height + MARGIN) this.respawn(st);
    }
  }
}
