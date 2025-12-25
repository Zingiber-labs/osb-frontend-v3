import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export const useMouseFollowCamera = () => {
  const { camera, size } = useThree();

  const mouse = useRef({ x: 0, y: 0 });
  const windowHalf = useRef({ x: size.width / 2, y: size.height / 2 });

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

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const { x: mouseX } = mouse.current;

    cam.position.x += (mouseX - cam.position.x) * 0.07;
    cam.position.y += (mouseX - cam.position.y) * 0.04;
    cam.position.z += (mouseX - cam.position.z) * 0.07;
  });
}
