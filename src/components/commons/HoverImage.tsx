"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

type HoverImageProps = {
  src: string;
  activeSrc: string;
  alt: string;
  width?: number;
  height?: number;
  href: string;
  className?: string;
  style?: React.CSSProperties;
  tooltipOffset?: number;
};

export function HoverImage({
  src,
  activeSrc,
  alt,
  width,
  height,
  href,
  className,
  style,
  tooltipOffset = -(height ?? 0) / 7,
}: HoverImageProps) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={href}
      aria-label={alt}
      className={`${className} absolute block cursor-pointer`}
      style={{ ...style, width, height }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={alt}
    >
      <div className="relative h-full w-full">
        <div className="relative z-0 h-full w-full transform-gpu will-change-transform animate-[hover-grow-shrink_2.8s_ease-in-out_infinite]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Image
                src={hover ? activeSrc : src}
                alt={alt}
                fill
                className="object-contain select-none"
              />
            </TooltipTrigger>
            <TooltipContent sideOffset={tooltipOffset}>
              <p>{alt}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Link>
  );
}
