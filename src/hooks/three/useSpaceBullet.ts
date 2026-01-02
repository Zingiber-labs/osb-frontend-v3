import { useEffect, useState } from "react";
import * as THREE from "three";
import type { Assets } from "@/lib/three/assets";
import { randCentered } from "@/lib/three/helpers";
import { MAIN_SPHERES, RAND_1000, SPREAD_3000 } from "@/lib/three/constants";

export const useSpaceBullets = (assets: Assets) => {
  const [bullets, setBullets] = useState<THREE.Group[]>([]);

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;

      const { sphere, material } = assets;

      const group = new THREE.Group();
      for (let i = 0; i < MAIN_SPHERES; i++) {
        const mesh = new THREE.Mesh(sphere, material);
        const offset = (i * SPREAD_3000) / (MAIN_SPHERES - 1);

        mesh.position.set(
          randCentered(RAND_1000) + offset,
          randCentered(RAND_1000) + offset,
          randCentered(RAND_1000) + offset
        );

        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        group.add(mesh);
      }

      setBullets((prev) => [...prev, group]);
    };

    window.addEventListener("keyup", onKeyUp);
    return () => window.removeEventListener("keyup", onKeyUp);
  }, [assets]);

  return bullets;
}
