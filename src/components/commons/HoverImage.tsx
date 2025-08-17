"use client";

import Image from "next/image";
import { useState } from "react";

type HoverImageProps = {
  src: string;
  activeSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
};

export function HoverImage({
  src,
  activeSrc,
  alt,
  width,
  height,
  className,
  style,
}: HoverImageProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={className}
      style={{ ...style, width, height, position: "absolute" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Image
        src={hover ? activeSrc : src}
        alt={alt}
        fill
        className="object-contain select-none"
      />
    </div>
  );
}
