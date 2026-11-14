"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "../ui/button";
import ExperienceLevels from "./ExperienceLevels";

interface InventoryDetailProps {
  inventory: any;
  onClose: () => void;
  image?: string;
}

const InventoryDetail = ({
  inventory,
  onClose,
  image,
}: InventoryDetailProps) => {
  const backgroundImage = image || "/img/detail_bg.png";
  const [imgError, setImgError] = useState(false);
  const iconSrc = imgError ? "/img/weapon.svg" : (inventory?.item?.iconUrl || "/img/weapon.svg");

  return (
    <div className="mt-8 rounded-lg overflow-hidden relative">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "rotate(180deg)",
        }}
      />

      <div className="relative z-10 p-6">
        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex items-center justify-center h-full">
            <div className="relative w-full h-[300px] flex items-center justify-center">
              <Image
                alt="inventory-image"
                src={iconSrc}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
                onError={() => setImgError(true)}
                priority
              />
            </div>
          </div>

          {/* Right Column - Stats and Details */}
          <div>
            <div className="flex justify-between items-center">
              <h2 className="text-secondary text-5xl">{inventory?.name}</h2>
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/10 text-2xl p-2"
              >
                ✕
              </Button>
            </div>
            <div>
              <p className="text-white text-2xl font-medium tracking-wide">
                WEAPON LEVEL
              </p>
            </div>
            <ExperienceLevels />

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3">
                EQUIP
              </Button>
              <Button className="flex-1 bg-secondary hover:bg-cyan-300 text-black py-3">
                DISMANTLE
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetail;
