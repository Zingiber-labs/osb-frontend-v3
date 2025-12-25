import * as THREE from "three";
import type { Assets } from "./assets";
import {
  CYLINDER_COUNT,
  MAIN_SPHERES,
  RAND_1000,
  RAND_2000,
  SPREAD_3000,
  SUBGROUP_BOXES,
  TORUS_COUNT,
} from "./constants";
import { randCentered } from "./helpers";

export const createStaticGroups = (assets: Assets) => {
  const { sphere, box, cylinder, torus, material } = assets;

  const groupMain = new THREE.Group();
  const boxSubgroups: THREE.Group[] = [];

  for (let i = 0; i < MAIN_SPHERES; i++) {
    const mesh = new THREE.Mesh(sphere, material);
    const offset = (i * SPREAD_3000) / MAIN_SPHERES;

    mesh.position.set(
      randCentered(RAND_1000) + offset,
      randCentered(RAND_1000) + offset,
      randCentered(RAND_1000) + offset
    );

    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    groupMain.add(mesh);

    const subgroup = new THREE.Group();
    for (let j = 0; j < SUBGROUP_BOXES; j++) {
      const boxMesh = new THREE.Mesh(box, material);
      boxMesh.position.set(
        mesh.position.x + randCentered(RAND_2000),
        mesh.position.y + randCentered(RAND_2000),
        mesh.position.z + randCentered(RAND_2000)
      );
      boxMesh.matrixAutoUpdate = false;
      boxMesh.updateMatrix();
      subgroup.add(boxMesh);
    }

    boxSubgroups.push(subgroup);
  }

  const groupTorus = new THREE.Group();
  for (let i = 0; i < TORUS_COUNT; i++) {
    const mesh = new THREE.Mesh(torus, material);
    mesh.position.set(-1000 + i * 4000, -1000 + i * 4000, -1000 + i * 4000);
    mesh.rotation.set(
      THREE.MathUtils.degToRad(100),
      THREE.MathUtils.degToRad(120),
      THREE.MathUtils.degToRad(100)
    );
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    groupTorus.add(mesh);
  }

  const groupCylinders = new THREE.Group();
  for (let i = 0; i < CYLINDER_COUNT; i++) {
    const mesh = new THREE.Mesh(cylinder, material);
    mesh.position.set(-1200 - i * 50, -1200, -1200 + i * 50);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    groupCylinders.add(mesh);
  }

  return { groupMain, boxSubgroups, groupTorus, groupCylinders };
}

export type StaticGroups = ReturnType<typeof createStaticGroups>;
