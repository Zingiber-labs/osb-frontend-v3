"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const frames = [
  "/img/gift/gift_1.svg",
  "/img/gift/gift_2.svg",
  "/img/gift/gift_3.svg",
  "/img/gift/gift_4.svg",
  "/img/gift/gift_5.svg",
  "/img/gift/gift_6.svg",
];

export default function AnimatedGift() {
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
      alt="Gift animation"
      width={96}
      height={96}
      className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] animate-bob"
    />
  );
}
