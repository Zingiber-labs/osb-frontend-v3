"use client";

import React from "react";
import { useInitScene } from "@/hooks/three/useInitScene";
import { useMouseFollowCamera } from "@/hooks/three/useMouseFollowCamera";
import type { Assets } from "@/lib/three/assets";
import { StaticGroups } from "@/lib/three/static-groups";
import { useSpaceBullets } from "@/hooks/three/useSpaceBullet";

export const Scene = ({
  assets,
  staticGroups,
}: {
  assets: Assets;
  staticGroups: StaticGroups;
}) => {
  useInitScene();
  useMouseFollowCamera();
  const bullets = useSpaceBullets(assets);

  return (
    <>
      {staticGroups.boxSubgroups.map((g, i) => (
        <primitive key={`boxSub-${i}`} object={g} />
      ))}

      <primitive object={staticGroups.groupMain} />
      <primitive object={staticGroups.groupTorus} />
      <primitive object={staticGroups.groupCylinders} />

      {bullets.map((g, i) => (
        <primitive key={`bullet-${i}`} object={g} />
      ))}
    </>
  );
};
