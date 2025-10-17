"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

type HoverImageProps = {
  src: string;
  activeSrc: string;
  alt: string;
  width: number;
  height: number;
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
  tooltipOffset = -height / 7,
}: HoverImageProps) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={href}
      className={`${className} absolute block cursor-pointer`}
      style={{ ...style, width, height }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={alt}
    >
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
    </Link>
  );
}
