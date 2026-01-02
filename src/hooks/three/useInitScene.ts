import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BG_COLOR, CAMERA, FOG_FAR, FOG_NEAR } from "@/lib/three/constants";

export const useInitScene = () => {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(BG_COLOR);
    scene.fog = new THREE.Fog(BG_COLOR, FOG_NEAR, FOG_FAR);

    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = CAMERA.fov;
    cam.near = CAMERA.near;
    cam.far = CAMERA.far;
    cam.position.copy(CAMERA.pos);
    cam.updateProjectionMatrix();
    cam.lookAt(CAMERA.lookAt);
  }, [scene, camera]);
}
