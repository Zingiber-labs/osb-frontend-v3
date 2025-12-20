"use client";
import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";

function Scene() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Create geometries
  const sphereGeometry = new THREE.SphereGeometry(150, 32, 16);
  const boxGeometry = new THREE.BoxGeometry(10, 10, 10);
  const icosahedronGeometry = new THREE.IcosahedronGeometry(1, 0);
  const cylinderGeometry = new THREE.CylinderGeometry(20, 20, 10);
  const torusGeometry = new THREE.TorusGeometry(2000, 50, 16, 100);
  const ringGeometry = new THREE.TorusGeometry(2500, 50, 16, 100);

  // // Create materials
  const colorfullMaterial = new THREE.MeshNormalMaterial(); // https://threejs.org/docs/#MeshNormalMaterial

  // Store all meshes in state if you want
  const [groups, setGroups] = useState<THREE.Group[]>([]);

  useEffect(() => {
    const allGroups: THREE.Group[] = [];
    const newGroup = new THREE.Group();

    for (let i = 0; i < 7; i++) {
      // Sphere
      const mesh = new THREE.Mesh(sphereGeometry, colorfullMaterial);
      mesh.position.set(
        Math.random() * 1000 - 500 + (i * 3000) / 7,
        Math.random() * 1000 - 500 + (i * 3000) / 7,
        Math.random() * 1000 - 500 + (i * 3000) / 7
      );
      mesh.updateMatrix();
      mesh.matrixAutoUpdate = false;

      // Sub-group of boxes
      const subGroup = new THREE.Group();
      for (let j = 0; j < 20; j++) {
        const mesh2 = new THREE.Mesh(boxGeometry, colorfullMaterial);
        mesh2.position.set(
          mesh.position.x + Math.random() * 2000 - 1000,
          mesh.position.y + Math.random() * 2000 - 1000,
          mesh.position.z + Math.random() * 2000 - 1000
        );
        mesh2.matrixAutoUpdate = false;
        mesh2.updateMatrix();
        subGroup.add(mesh2);
      }
      newGroup.add(mesh);
      newGroup.add(subGroup);
    }

    for (let g = 0; g < 3; g++) {
      // Add extra geometries to the group
      const icoMesh = new THREE.Mesh(icosahedronGeometry, colorfullMaterial);
      icoMesh.position.set(0, 0, 0);
      icoMesh.matrixAutoUpdate = false;
      icoMesh.updateMatrix();

      const torusMesh = new THREE.Mesh(torusGeometry, colorfullMaterial);
      torusMesh.position.set(1000, 0, -500);
      torusMesh.rotation.set(Math.PI / 2, Math.PI / 2, Math.PI / 2);
      torusMesh.matrixAutoUpdate = false;
      torusMesh.updateMatrix();

      const cylinderMesh = new THREE.Mesh(cylinderGeometry, colorfullMaterial);
      cylinderMesh.position.set(-500, -200, 500);
      cylinderMesh.matrixAutoUpdate = false;
      cylinderMesh.updateMatrix();

      const ringMesh = new THREE.Mesh(ringGeometry, colorfullMaterial);
      ringMesh.position.set(-1000, -1000, -1000);
      ringMesh.matrixAutoUpdate = false;
      ringMesh.updateMatrix();

      newGroup.add(icoMesh, torusMesh, cylinderMesh, ringMesh);

      allGroups.push(newGroup);
    }

    setGroups(allGroups);
  }, []);

  const { camera } = useThree();

  // Scale down mouse influence
  useFrame(() => {
    if (cameraRef.current) {
      camera.position.x += (mouse.x - camera.position.x) * 0.01;
      camera.position.y += (mouse.y - camera.position.y) * 0.01;
      camera.position.z += (mouse.x - camera.position.z) * 0.01;
    }
  });

  const handleMouseMove = (event: MouseEvent) => {
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;
    setMouse({
      x: (event.clientX - windowHalfX) * 10,
      y: (event.clientY - windowHalfY) * 10,
    });
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <perspectiveCamera
        ref={cameraRef}
        fov={60}
        near={0}
        far={10000} // smaller far plane for better depth perception
        position={[0, 0, 0]} // closer to the scene
        lookAt={[0, 0, 0]} // center the view
      />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      {groups.map((g, i) => (
        <primitive object={g} key={i} />
      ))}
    </>
  );
}

export default function App() {
  return (
    <Canvas
      style={{ height: "100vh", width: "100vw" }}
      gl={{ antialias: false }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color(0x2b2b2b);
        scene.fog = new THREE.Fog(0x2b2b2b, 1, 10000);
      }}
    >
      <Scene />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={2000} // max zoom out
        minDistance={200} // max zoom in
        zoomSpeed={0.02} // lower = slower zoom
        rotateSpeed={0.5} // optional, slows rotation
        panSpeed={0.5} // optional, slows panning
      />
    </Canvas>
  );
}
