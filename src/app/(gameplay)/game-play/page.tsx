"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSearchParams } from "next/navigation";
import { useGameTeam } from "@/hooks/gameplay/useGameplay";

function Scene() {
  const { scene, camera, size } = useThree();

  const mouse = useRef({ x: 0, y: 0 });
  const windowHalf = useRef({ x: size.width / 2, y: size.height / 2 });

  const assets = useMemo(() => {
    const sphere = new THREE.SphereGeometry(150, 32, 16);
    const box = new THREE.BoxGeometry(10, 10, 10);
    const icosahedron = new THREE.IcosahedronGeometry(1, 0);
    const cylinder = new THREE.CylinderGeometry(20, 20, 10);
    const torus = new THREE.TorusGeometry(2000, 50, 16, 100);
    const material2 = new THREE.MeshNormalMaterial();

    return { sphere, box, icosahedron, cylinder, torus, material2 };
  }, []);

  // Main groups from init()
  const staticGroups = useMemo(() => {
    const { sphere, box, cylinder, torus, material2 } = assets;

    const groupMain = new THREE.Group();

    // 7 spheres + 7 subgroups of 20 boxes
    const boxSubgroups: THREE.Group[] = [];
    for (let i = 0; i < 7; i++) {
      const mesh = new THREE.Mesh(sphere, material2);
      mesh.position.set(
        Math.random() * 1000 - 500 + (i * 3000) / 7,
        Math.random() * 1000 - 500 + (i * 3000) / 7,
        Math.random() * 1000 - 500 + (i * 3000) / 7
      );
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      groupMain.add(mesh);

      const group2 = new THREE.Group();
      for (let j = 0; j < 20; j++) {
        const mesh2 = new THREE.Mesh(box, material2);
        mesh2.position.set(
          mesh.position.x + (Math.random() * 2000 - 1000),
          mesh.position.y + (Math.random() * 2000 - 1000),
          mesh.position.z + (Math.random() * 2000 - 1000)
        );
        mesh2.matrixAutoUpdate = false;
        mesh2.updateMatrix();
        group2.add(mesh2);
      }
      boxSubgroups.push(group2);
    }

    // group3: 2 torus meshes
    const group3 = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const mesh3 = new THREE.Mesh(torus, material2);
      mesh3.position.set(-1000 + i * 4000, -1000 + i * 4000, -1000 + i * 4000);
      mesh3.rotation.set(
        THREE.MathUtils.degToRad(100),
        THREE.MathUtils.degToRad(120),
        THREE.MathUtils.degToRad(100)
      );
      mesh3.matrixAutoUpdate = false;
      mesh3.updateMatrix();
      group3.add(mesh3);
    }

    // group4: 10 cylinders
    const group4 = new THREE.Group();
    for (let i = 0; i < 10; i++) {
      const mesh4 = new THREE.Mesh(cylinder, material2);
      mesh4.position.set(-1200 - i * 50, -1200, -1200 + i * 50);
      mesh4.matrixAutoUpdate = false;
      mesh4.updateMatrix();
      group4.add(mesh4);
    }

    return { groupMain, boxSubgroups, group3, group4 };
  }, [assets]);

  // Dynamic "bullets" (Space)
  const [bullets, setBullets] = useState<THREE.Group[]>([]);

  // init() scene setup
  useEffect(() => {
    scene.background = new THREE.Color(0x2b2b2b);
    scene.fog = new THREE.Fog(0x2b2b2b, 1, 10000);

    // Camera setup
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 60;
    cam.near = 1;
    cam.far = 20000;
    cam.position.set(-2000, 0, -2000);
    cam.updateProjectionMatrix();

    cam.lookAt(new THREE.Vector3(4000, 6000, 4000));
  }, [scene, camera]);

  useEffect(() => {
    windowHalf.current = { x: size.width / 2, y: size.height / 2 };
  }, [size.width, size.height]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const half = windowHalf.current;
      mouse.current.x = (event.clientX - half.x) * 10;
      mouse.current.y = (event.clientY - half.y) * 10;
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;

      const { sphere, material2 } = assets;

      const group = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        const mesh = new THREE.Mesh(sphere, material2);
        mesh.position.set(
          Math.random() * 1000 - 500 + (i * 3000) / 6,
          Math.random() * 1000 - 500 + (i * 3000) / 6,
          Math.random() * 1000 - 500 + (i * 3000) / 6
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

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const { x: mouseX } = mouse.current;

    cam.position.x += (mouseX - cam.position.x) * 0.07;
    cam.position.y += (mouseX - cam.position.y) * 0.04;
    cam.position.z += (mouseX - cam.position.z) * 0.07;
  });

  return (
    <>
      {/* Equivalent to scene.add(group2) for each subgroup */}
      {staticGroups.boxSubgroups.map((g, i) => (
        <primitive key={`boxSub-${i}`} object={g} />
      ))}

      {/* scene.add(group) */}
      <primitive object={staticGroups.groupMain} />

      {/* scene.add(group3) */}
      <primitive object={staticGroups.group3} />

      {/* scene.add(group4) */}
      <primitive object={staticGroups.group4} />

      {/* bullets added with Space */}
      {bullets.map((g, i) => (
        <primitive key={`bullet-${i}`} object={g} />
      ))}
    </>
  );
}

export default function ThreeVanillaReplica() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId") ?? "";

  const { data: teamData, isLoading, isError } = useGameTeam(teamId)
  console.log("Team Data:", teamData, isLoading, isError);

  return (
    <Canvas
      style={{ height: "100vh", width: "100vw" }}
      gl={{ antialias: false }}
    >
      <Scene />
      {/* <ambientLight /> */}
      <pointLight position={[10, 10, 10]} />
    </Canvas>
  );
}
