"use client";

import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { createAssets } from "@/lib/three/assets";
import { createStaticGroups } from "@/lib/three/static-groups";
import { Scene } from "./Scene";

export const ThreeGameplayCanvas = () => {
  const assets = useMemo(() => createAssets(), []);
  const staticGroups = useMemo(() => createStaticGroups(assets), [assets]);

  return (
    <Canvas
      style={{ height: "100vh", width: "100vw" }}
      gl={{ antialias: false }}
    >
      <Scene assets={assets} staticGroups={staticGroups} />
      <pointLight position={[10, 10, 10]} />
    </Canvas>
  );
};
