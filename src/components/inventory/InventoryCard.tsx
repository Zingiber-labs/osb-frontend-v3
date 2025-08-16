import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardContent,
} from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface Inventory {
  name: string;
  level?: string;
  src: string;
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
  return (
    <Card
      className="group bg-orange-24 pt-2 hover:shadow-lg text-white font-bold border-2 border-transparent hover:bg-transparent hover:border-secondary transition-colors duration-300 cursor-pointer"
      onClick={() => onClick(inventory)}
    >
      <CardHeader className="px-2">
        <div className="bg-card-bg rounded-lg flex justify-center py-5">
          <Image
            src={inventory.src || ""}
            alt={inventory.name}
            width={108}
            height={60}
            className="object-contain"
          />
        </div>
        <CardContent className="px-2">
          <div className="flex justify-between pt-10">
            <p className="text-2xl">{inventory.name}</p>
            <p className="text-secondary">{`lvl ${inventory.level}`}</p>
          </div>
        </CardContent>
      </CardHeader>
    </Card>
  );
};

export default InventoryCard;
