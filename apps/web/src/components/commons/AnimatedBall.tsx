"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const frames = [
  "/img/ball_1.svg",
  "/img/ball_2.svg",
  "/img/ball_3.svg",
  "/img/ball_4.svg",
  "/img/ball_5.svg",
];

export default function AnimatedBall() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Image
      src={frames[frame]}
      alt="Ball animation"
      width={96}
      height={96}
      className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] animate-bob"
    />
  );
}
