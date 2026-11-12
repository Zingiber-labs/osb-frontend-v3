import { useEffect } from "react";
import * as THREE from "three";
import type { Assets } from "@/lib/three/assets";
import { PlayerInfo } from "@/types/team";

const makeTeamTorusMesh = (assets: Assets) => {
  const mesh = new THREE.Mesh(assets.torus, assets.material);
  mesh.rotation.set(
    THREE.MathUtils.degToRad(100),
    THREE.MathUtils.degToRad(120),
    THREE.MathUtils.degToRad(100)
  );
  mesh.matrixAutoUpdate = false;
  return mesh;
};

export function useApplyTeamsToTorus({
  assets,
  groupTorus,
  playerData,
}: {
  assets: Assets;
  groupTorus: THREE.Group;
  playerData?: PlayerInfo;
}) {
  useEffect(() => {
    if (!playerData) return;

    groupTorus.clear();

    const teams = [
      { side: "home" as const, team: playerData.home_team },
      { side: "visitor" as const, team: playerData.visitor_team },
    ];

    teams.forEach((t, idx) => {
      const mesh = makeTeamTorusMesh(assets);
      const base = -1000;
      const spread = 4000;
      const pos = idx === 0 ? base : base + spread;

      mesh.position.set(pos, pos, pos);

      mesh.userData = {
        type: "team-torus",
        side: t.side,
        teamId: t.team.id,
        fullName: t.team.full_name,
        abbr: t.team.abbreviation,
        gameId: playerData.id,
      };

      mesh.updateMatrix();
      groupTorus.add(mesh);
    });
  }, [assets, groupTorus, playerData]);
}
