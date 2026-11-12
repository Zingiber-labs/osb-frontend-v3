"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

type TaglineProps = {
  primary?: string;
  secondary?: string;
  className?: string;
};

function TaglineMark({
  primary = "BEST",
  secondary = "WEAPON",
  className = "",
}: TaglineProps) {
  return (
    <div className={`flex items-start gap-3 sm:gap-4 ${className}`}>
      <div className="leading-none border-l-2 border-primary pl-5">
        <div className="uppercase tracking-[0.35em] text-white text-lg sm:text-[20px] md:text-[22px] font-light">
          {primary}
        </div>
        <div className="uppercase tracking-[0.35em] text-orange-32 text-xs sm:text-[18px] md:text-[20px] font-light">
          {secondary}
        </div>
      </div>
    </div>
  );
}

interface WeaponBannerProps {
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  contentImageUrl?: string;
  contentImageAlt?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  overlayClassName?: string;

  showTagline?: boolean;
  taglinePrimary?: string;
  taglineSecondary?: string;
}

export default function WeaponBanner({
  title,
  subtitle,
  description,
  imageUrl,
  contentImageUrl,
  contentImageAlt = "banner-side-img",
  buttonText = "BUY ITEM",
  onButtonClick,
  overlayClassName = "bg-black/50",
  showTagline = true,
  taglinePrimary = "BEST",
  taglineSecondary = "WEAPON",
}: WeaponBannerProps) {
  return (
    <section className="relative w-full rounded-2xl overflow-hidden">
      {/* Background */}
      <Image
        src={imageUrl}
        alt={title}
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Overlay */}
      <div className={`absolute inset-0 ${overlayClassName}`} />

      <div className="relative z-10 p-5 sm:p-8 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
          {contentImageUrl && (
            <div className="order-1 lg:order-2 flex items-center justify-center">
              <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto">
                <Image
                  alt={contentImageAlt}
                  src={contentImageUrl}
                  width={800}
                  height={800}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          )}

          <div className="order-2 lg:order-1 flex flex-col justify-center gap-4 sm:gap-5 max-w-2xl">
            {showTagline && (
              <TaglineMark primary={taglinePrimary} secondary={taglineSecondary} />
            )}

            {subtitle && (
              <p className="text-orange-500 tracking-widest uppercase text-xs sm:text-sm">
                {subtitle}
              </p>
            )}
            <h2 className="font-bold tracking-widest text-orange-500 text-3xl sm:text-4xl md:text-5xl leading-tight">
              {title}
            </h2>
            <p className="text-gray-200 text-sm md:text-base leading-relaxed">
              {description}
            </p>
            <Button
              onClick={onButtonClick}
              className="bg-cyan-400 hover:bg-cyan-500 text-black px-6 py-2 rounded-full w-full sm:w-fit"
            >
              {buttonText.toUpperCase()}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
