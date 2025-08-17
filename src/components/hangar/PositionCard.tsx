import React from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface PositionCardProps {
  alt: string;
  srcUrl: string;
  label: string;
}

const PositionCard = ({ alt, srcUrl, label }: PositionCardProps) => {
  return (
    <Card
      className="
        group 
        bg-orange-24 border-0 h-full 
        transition-colors 
        hover:bg-grey-dark-40
      "
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
          className="
            bg-orange-dark text-white 
            transition-colors
            group-hover:bg-gray-600 group-hover:text-white
          "
        >
          Select your position
        </Button>
      </CardContent>
    </Card>
  );
};

export default PositionCard;
