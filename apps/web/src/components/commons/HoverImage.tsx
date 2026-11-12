"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type HoverImageProps = {
  src: string;
  activeSrc: string;
  alt: string;
  width: number;
  height: number;
  href?: string;
  onClick?: () => void;
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
  onClick,
  className = "",
  style,
  tooltipOffset = -height / 7,
}: HoverImageProps) {
  const [hover, setHover] = useState(false);

  const Wrapper: any = onClick ? "button" : Link;

  const wrapperProps = onClick
    ? { type: "button", onClick }
    : { href: href ?? "#" };

  return (
    <Wrapper
      {...wrapperProps}
      className={className}
      style={{ ...style, width, height }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={alt}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="relative block w-full h-full">
            <Image
              src={hover ? activeSrc : src}
              alt={alt}
              fill
              sizes={`${width}px`}
              className="object-contain select-none"
            />
          </span>
        </TooltipTrigger>

        <TooltipContent sideOffset={tooltipOffset}>
          <p>{alt}</p>
        </TooltipContent>
      </Tooltip>
    </Wrapper>
  );
}
