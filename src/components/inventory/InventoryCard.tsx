import {
  Card,
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { MyInventory } from "@/types/inventory-items";
import { Lock } from "lucide-react";
import Image from "next/image";
import { Label } from "../ui/label";

interface InventoryCardProps {
  inventory: MyInventory;
  isSelected: boolean;
  onClick: (inventory: MyInventory) => void;
}

const InventoryCard = ({
  inventory,
  onClick,
  isSelected,
}: InventoryCardProps) => {
  // TODO: remove hardcoded equipped value
  const isLocked = false

  return (
    <Card
      className={`group pt-2 pb-2 text-white font-bold border-2 transition-colors duration-300 relative flex flex-col h-full
        ${
          isSelected
            ? "shadow-lg bg-[#10101099] border-secondary"
            : "bg-orange-24 border-transparent hover:shadow-lg hover:bg-[#10101099] hover:border-secondary"
        }
        ${
          isLocked
            ? "bg-grey-dark hover:bg-grey-dark cursor-not-allowed hover:border-[#10101099] hover:shadow-none"
            : "cursor-pointer"
        }
      `}
      onClick={() => !isLocked && onClick(inventory)}
    >
      <CardHeader className="px-2 relative">
        <div className="bg-gray-300 rounded-lg flex justify-center py-5 relative">
          <Image
            src={"/img/gun.svg"}
            alt={inventory.item.name}
            width={108}
            height={60}
            className={`object-contain ${isLocked ? "opacity-40" : ""}`}
          />

          {inventory.equipped && (
            <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-semibold rounded-full px-3 py-1 tracking-wide shadow-md">
              EQUIPPED
            </div>
          )}

          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock size={60} className="text-cyan-400 drop-shadow-lg" />
            </div>
          )}
        </div>
        <p className="text-2xl">{inventory.item.name}</p>
      </CardHeader>
      <CardFooter className="mt-auto gap-4 justify-between">
        <p className="text-secondary">{`lvl ${inventory.item?.upgradeAttributes?.currentLevel ?? 0}`}</p>
        <div>
          <Label
            htmlFor="quantity"
            className="text-white rounded-2xl p-2 text-[10px] bg-orange-dark tracking-widest"
          >
            Quantity: {inventory.quantity ?? 0}
          </Label>
        </div>
      </CardFooter>
    </Card>
  );
};

export default InventoryCard;
