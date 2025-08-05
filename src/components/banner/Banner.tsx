"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

interface WeaponBannerProps {
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  buttonText?: string;
  onButtonClick?: () => void;
  overlayClassName?: string;
}

export default function WeaponBanner({
  title,
  subtitle,
  description,
  imageUrl,
  buttonText = "Add to Card",
  onButtonClick,
  overlayClassName = "bg-black/70",
}: WeaponBannerProps) {
  return (
    <section
      className="
        relative w-full rounded-2xl overflow-hidden 
        flex items-center justify-start 
        p-6 sm:p-8 md:p-12
        min-h-[300px] sm:min-h-[350px] md:min-h-[400px]
        max-h-[90vh] overflow-y-auto
      "
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover object-center"
        priority
      />

      {/* Overlay */}
      <div className={`absolute inset-0 ${overlayClassName}`}></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl text-left space-y-4">
        <div>
          <p className="text-orange-500 tracking-widest uppercase text-sm mb-1">
            {subtitle}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-widest text-orange-500 break-words">
            {title}
          </h2>
        </div>
        <p className="text-gray-300 text-sm md:text-base leading-relaxed break-words">
          {description}
        </p>
        <Button
          onClick={onButtonClick}
          className="bg-cyan-400 hover:bg-cyan-500 text-black px-6 py-2 rounded-full w-fit"
        >
          {buttonText.toUpperCase()}
        </Button>
      </div>
    </section>
  );
}
