"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { StoreItem } from "@/types/store-items";

interface WeaponPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weapon: StoreItem;
}

export default function WeaponPreview({
  open,
  onOpenChange,
  weapon,
}: WeaponPreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle></DialogTitle>
      <DialogContent
        className="max-w-[500px] rounded-[1.5rem] border-none 
                   bg-gradient-to-b from-[#531700] to-black 
                   text-white p-0"
      >
        <div className="absolute inset-0 z-0 opacity-20">
          <Image
            src={"/img/gun.svg"}
            alt="background"
            fill
            className="object-cover"
          />
        </div>
        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <Image
              src={"/img/gun.svg"}
              alt={weapon.name}
              width={300}
              height={200}
              className="object-contain"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">{weapon.name}</h2>
            <p className="text-gray-300 mt-2 leading-relaxed">
              {weapon.description}
            </p>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-2xl font-mono">{weapon.price}</p>
            <Button className="bg-secondary hover:bg-secondary-500 text-black rounded-full px-6 py-2">
              ADD TO CARD
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
