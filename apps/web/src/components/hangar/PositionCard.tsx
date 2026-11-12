import React from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface PositionCardProps {
  alt: string;
  srcUrl: string;
  label: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

const PositionCard = ({ alt, srcUrl, label, isSelected, onSelect }: PositionCardProps) => {
  return (
    <Card
      onClick={onSelect}
      className={`group h-full transition-colors cursor-pointer 
        ${isSelected 
          ? "bg-grey-dark-40 border-secondary" 
          : "bg-orange-24 border-0 hover:bg-grey-dark-40"}`
      }
    >
      <CardContent className="flex flex-col items-center text-center p-4">
        <Image
          alt={alt}
          src={srcUrl}
          width={64}
          height={64}
          className="object-contain mb-3"
        />
        <p className="mb-2 text-sm text-secondary-cyan font-semibold">
          {label}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className={`transition-colors
            ${isSelected 
              ? "bg-grey-dark-40 text-white border-primary" 
              : "bg-orange-dark text-white group-hover:bg-gray-600 group-hover:text-white"}`
          }
        >
          {isSelected ? "Selected" : "Select your position"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PositionCard;
