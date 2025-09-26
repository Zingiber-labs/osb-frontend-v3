import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Lock } from "lucide-react";
import { Label } from "../ui/label";

interface Inventory {
  id: string;
  name: string;
  level?: string;
  src: string;
  locked?: boolean;
}
interface InventoryCardProps {
  inventory: Inventory;
  isSelected: boolean;
  onClick: (inventory: Inventory) => void;
}

const InventoryCard = ({
  inventory,
  onClick,
  isSelected,
}: InventoryCardProps) => {
  const { locked } = inventory;

  return (
    <Card
      className={`group pt-2 text-white font-bold border-2 transition-colors duration-300 relative
        ${
          isSelected
            ? "shadow-lg bg-transparent border-secondary"
            : "bg-orange-24 border-transparent hover:shadow-lg hover:bg-[#10101099] hover:border-secondary"
        }
        ${
          locked
            ? "bg-grey-dark hover:bg-grey-dark cursor-not-allowed hover:border-transparent hover:shadow-none"
            : "cursor-pointer"
        }
      `}
      onClick={() => !locked && onClick(inventory)}
    >
      <CardHeader className="px-2 relative">
        <div className="bg-gray-300 rounded-lg flex justify-center py-5 relative">
          <Image
            src={inventory.src || ""}
            alt={inventory.name}
            width={108}
            height={60}
            className={`object-contain ${locked ? "opacity-40" : ""}`}
          />

          {locked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock size={60} className="text-cyan-400 drop-shadow-lg" />
            </div>
          )}
        </div>
        <CardContent className="px-2">
          <div className="flex justify-between pt-10">
            <p className="text-2xl">{inventory.name}</p>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-secondary">{`lvl ${inventory.level}`}</p>
            <Label
              htmlFor="quantity"
              className="text-white rounded-2xl p-2 text-[10px] bg-orange-dark tracking-widest"
            >
              Quantity: 06
            </Label>
          </div>
        </CardContent>
      </CardHeader>
    </Card>
  );
};

export default InventoryCard;
