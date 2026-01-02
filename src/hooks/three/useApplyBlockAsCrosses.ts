import { useEffect } from "react";
import * as THREE from "three";
import type { Assets } from "@/lib/three/assets";
import { randCentered } from "@/lib/three/helpers";
import { RAND_1000, SPREAD_3000 } from "@/lib/three/constants";
import { PlayerInfo } from "@/types/team";

const createCrossX = (assets: Assets) => {
  const barGeom = new THREE.BoxGeometry(400, 30, 30);

  const bar1 = new THREE.Mesh(barGeom, assets.material);
  const bar2 = new THREE.Mesh(barGeom, assets.material);

  bar1.rotation.z = THREE.MathUtils.degToRad(45);
  bar2.rotation.z = THREE.MathUtils.degToRad(-45);

  bar1.matrixAutoUpdate = false;
  bar2.matrixAutoUpdate = false;
  bar1.updateMatrix();
  bar2.updateMatrix();

  const cross = new THREE.Group();
  cross.add(bar1, bar2);

  cross.matrixAutoUpdate = false;
  return cross;
};

export function useApplyBlocksAsCrosses({
  assets,
  groupBlocks,
  playerData,
}: {
  assets: Assets;
  groupBlocks: THREE.Group;
  playerData?: PlayerInfo;
}) {
  useEffect(() => {
    if (!playerData) return;

    const totalBlk =
      playerData.statistics?.reduce((sum, s) => sum + (s.blk ?? 0), 0) ?? 0;

    groupBlocks.clear();

    for (let i = 0; i < totalBlk; i++) {
      const cross = createCrossX(assets);

      const offset = (i * SPREAD_3000) / Math.max(1, totalBlk);

      cross.position.set(
        randCentered(RAND_1000) + offset,
        randCentered(RAND_1000),
        randCentered(RAND_1000) - offset
      );

      cross.userData = {
        type: "block-cross",
        index: i,
      };

      cross.updateMatrix();
      groupBlocks.add(cross);
    }
  }, [assets, groupBlocks, playerData]);
}
