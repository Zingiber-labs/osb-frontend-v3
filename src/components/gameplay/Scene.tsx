"use client";

import React from "react";
import { useInitScene } from "@/hooks/three/useInitScene";
import { useMouseFollowCamera } from "@/hooks/three/useMouseFollowCamera";
import type { Assets } from "@/lib/three/assets";
import { StaticGroups } from "@/lib/three/static-groups";
import { useSpaceBullets } from "@/hooks/three/useSpaceBullet";
import { useApplyTeamsToTorus } from "@/hooks/three/useApplyTeamsToTorus";
import { PlayerInfo } from "@/types/team";
import { useApplyPointsToMain } from "@/hooks/three/useApplyPointsToMain";
import { useApplyBlocksAsCrosses } from "@/hooks/three/useApplyBlockAsCrosses";

export const Scene = ({
  assets,
  staticGroups,
  playerData,
}: {
  assets: Assets;
  staticGroups: StaticGroups;
  playerData: PlayerInfo;
}) => {
  useInitScene();
  useMouseFollowCamera();
  useApplyTeamsToTorus({
    assets,
    groupTorus: staticGroups.groupTorus,
    playerData,
  });
  useApplyPointsToMain({
    assets,
    groupMain: staticGroups.groupMain,
    playerData,
  });
   useApplyBlocksAsCrosses({
    assets,
    groupBlocks: staticGroups.groupBlocks,
    playerData,
  });

  const bullets = useSpaceBullets(assets);

  return (
    <>
      {staticGroups.boxSubgroups.map((g, i) => (
        <primitive key={`boxSub-${i}`} object={g} />
      ))}

      <primitive object={staticGroups.groupMain} />
      <primitive object={staticGroups.groupTorus} />
      <primitive object={staticGroups.groupCylinders} />
      <primitive object={staticGroups.groupBlocks} />

      {bullets.map((g, i) => (
        <primitive key={`bullet-${i}`} object={g} />
      ))}
    </>
  );
};
