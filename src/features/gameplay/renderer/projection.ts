/** Pure perspective helpers. The camera sits at z = 0 looking down +z; world units equal design pixels at z = FOCAL. */

export type Vec3 = { x: number; y: number; z: number };
export type View = { vp: { x: number; y: number }; f: number };
export type Projected = { sx: number; sy: number; scale: number };

export const DESIGN = { width: 1280, height: 720 } as const;
export const FOCAL = 400;
export const DEFAULT_VIEW: View = { vp: { x: 640, y: 302 }, f: FOCAL };

/** The player ship is a fixed screen sprite; this is where it sits and the world point that projects there. */
export const SHIP_SCREEN = { x: 640, y: 533 } as const;
export const SHIP_WORLD: Vec3 = { x: 0, y: SHIP_SCREEN.y - DEFAULT_VIEW.vp.y, z: FOCAL };
/** Wing cannon muzzles, in world units at the ship's depth. */
export const CANNONS: [Vec3, Vec3] = [
  { x: -80, y: SHIP_WORLD.y - 16, z: FOCAL },
  { x: 80, y: SHIP_WORLD.y - 16, z: FOCAL },
];
/** Resting position of the aiming reticle, between the ship and the vanishing point. */
export const RETICLE_HOME = { x: 640, y: 420 } as const;

export function project(p: Vec3, view: View = DEFAULT_VIEW): Projected {
  const scale = view.f / p.z;
  return { sx: view.vp.x + p.x * scale, sy: view.vp.y + p.y * scale, scale };
}

export function toWorld(sx: number, sy: number, z: number, view: View = DEFAULT_VIEW): Vec3 {
  const k = z / view.f;
  return { x: (sx - view.vp.x) * k, y: (sy - view.vp.y) * k, z };
}

/** Sortable-children key: nearer (smaller z) sorts on top. */
export function zIndexFor(z: number): number {
  return -z;
}

export function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

/** Cover-fit of the design frame onto the host: largest ratio, centred, edges cropped. */
export function fitStage(hostWidth: number, hostHeight: number): { scale: number; x: number; y: number } {
  const scale = Math.max(hostWidth / DESIGN.width, hostHeight / DESIGN.height);
  return { scale, x: (hostWidth - DESIGN.width * scale) / 2, y: (hostHeight - DESIGN.height * scale) / 2 };
}
