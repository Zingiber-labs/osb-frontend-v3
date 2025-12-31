import { useEffect } from "react";
import * as THREE from "three";
import type { Assets } from "@/lib/three/assets";
import { randCentered } from "@/lib/three/helpers";
import { RAND_1000, SPREAD_3000 } from "@/lib/three/constants";
import { PlayerInfo } from "@/types/team";

export function useApplyPointsToMain({
  assets,
  groupMain,
  playerData,
}: {
  assets: Assets;
  groupMain: THREE.Group;
  playerData?: PlayerInfo;
}) {
  useEffect(() => {
    if (!playerData) return;

    const totalPts =
      playerData.statistics?.reduce((sum, s) => sum + (s.pts ?? 0), 0) ?? 0;

    groupMain.clear();

    const count = Math.max(0, totalPts);

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(assets.sphere, assets.material);

      const offset = (i * SPREAD_3000) / Math.max(1, count);

      mesh.position.set(
        randCentered(RAND_1000) + offset,
        randCentered(RAND_1000) + offset,
        randCentered(RAND_1000) + offset
      );

      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();

      mesh.userData = {
        type: "point-sphere",
        index: i,
      };

      groupMain.add(mesh);
    }
  }, [assets, groupMain, playerData]);
}
