import * as THREE from "three";

export const BG_COLOR = 0x2b2b2b;
export const FOG_NEAR = 1;
export const FOG_FAR = 10000;

export const CAMERA = {
  fov: 60,
  near: 1,
  far: 20000,
  pos: new THREE.Vector3(-2000, 0, -2000),
  lookAt: new THREE.Vector3(4000, 6000, 4000),
};

export const MAIN_SPHERES = 7;
export const SUBGROUP_BOXES = 20;
export const TORUS_COUNT = 2;
export const CYLINDER_COUNT = 1;

export const RAND_1000 = 1000;
export const RAND_2000 = 2000;
export const SPREAD_3000 = 3000;
