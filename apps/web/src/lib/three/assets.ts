import * as THREE from "three";

export const createAssets = () => {
  const sphere = new THREE.SphereGeometry(150, 32, 16);
  const box = new THREE.BoxGeometry(10, 10, 10);
  const icosahedron = new THREE.IcosahedronGeometry(1, 0);
  const cylinder = new THREE.CylinderGeometry(20, 20, 10);
  const torus = new THREE.TorusGeometry(2000, 50, 16, 100);
  const material = new THREE.MeshNormalMaterial();

  return { sphere, box, icosahedron, cylinder, torus, material };
};

export type Assets = ReturnType<typeof createAssets>;
