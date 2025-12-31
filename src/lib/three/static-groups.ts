import * as THREE from "three";
import type { Assets } from "./assets";
import { CYLINDER_COUNT } from "./constants";

export const createStaticGroups = (assets: Assets) => {
  const { cylinder, material } = assets;

  const groupMain = new THREE.Group();
  const boxSubgroups: THREE.Group[] = [];

  const groupTorus = new THREE.Group();
  const groupBlocks = new THREE.Group();

  const groupCylinders = new THREE.Group();
  for (let i = 0; i < CYLINDER_COUNT; i++) {
    const mesh = new THREE.Mesh(cylinder, material);
    mesh.position.set(-1200 - i * 50, -1200, -1200 + i * 50);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    groupCylinders.add(mesh);
  }

  return { groupMain, boxSubgroups, groupTorus, groupCylinders, groupBlocks };
};

export type StaticGroups = ReturnType<typeof createStaticGroups>;
