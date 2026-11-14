import React from "react";
import Link from "next/link";

type LogoSize = "small" | "medium" | "large";

interface SiteLogoProps {
  logoType?: "text" | "image" | "svg";
  text?: string;
  imageSrc?: string;
  size?: LogoSize; 
  className?: string;
  href?: string;
}

const SiteLogo = ({ 
  logoType = "image",
  text = "Outer Sports", 
  imageSrc = "/logo.png", 
  size = "medium", // 'small' | 'medium' | 'large'
  className = "",
  href = "/"
}: SiteLogoProps) => {
  const sizeClasses = {
    small: "text-xl h-8",
    medium: "text-2xl h-10",
    large: "text-3xl h-12"
  };

  const textStyle = "font-apex-mk2 font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600";

  return (
    <Link href={href} passHref>
      <div 
        className={`flex items-center cursor-pointer transition-all hover:scale-105 ${sizeClasses[size]} ${className}`}
        aria-label="Logo del sitio"
      >
        {logoType === "text" ? (
          <span className={textStyle}>{text}</span>
        ) : logoType === "image" ? (
          <img 
            src={imageSrc} 
            alt={`${text} Logo`} 
            className="h-full w-auto object-contain"
            draggable="false"
          />
        ) : (
          <svg 
            className="h-full w-auto text-white" 
            viewBox="0 0 120 40" 
            fill="currentColor"
          >
            <rect x="10" y="5" width="30" height="30" rx="5" />
            <circle cx="70" cy="20" r="15" />
            <polygon points="100,5 120,20 100,35" />
          </svg>
        )}
      </div>
    </Link>
  );
};

export default SiteLogo;