import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InventoryCard from "@/components/inventory/InventoryCard";

const weapons = [
  { name: "BLUE ORB", src: "/img/gun.svg", level: "5" },
  { name: "BLUE SHIELD", src: "/img/gun.svg", level: "5" },
  { name: "RED SWORD", src: "/img/gun.svg", level: "5" },
  { name: "GREEN BOW", src: "/img/gun.svg", level: "5" },
  { name: "BLACK AXE", src: "/img/gun.svg", level: "5" },
  { name: "GOLDEN STAFF", src: "/img/gun.svg", level: "5" },
  { name: "GREEN BOW", src: "/img/gun.svg", level: "5" },
  { name: "BLACK AXE", src: "/img/gun.svg", level: "5" },
  { name: "GOLDEN STAFF", src: "/img/gun.svg", level: "5" },
];

const Inventory = () => {
  return (
    <div>
      <p className="text-secondary text-5xl font-bold mt-14 mb-6">
        My inventory
      </p>
      <p className="text-white text-sm normal-case mt-10">
        Select Your Loadouts
      </p>
      <div className="mt-4 flex justify-between">
        <Select>
          <SelectTrigger className="w-[300px] text-white bg-orange-dark cursor-pointer">
            <SelectValue className="text-white" placeholder="Weapons" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ships">Ships</SelectItem>
              <SelectItem value="skills">Skills</SelectItem>
              <SelectItem value="weapons">Weapons</SelectItem>
              <SelectItem value="ammunition">Ammunition</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-20 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {weapons.map((weapon, index) => {
          return <InventoryCard key={index} weapon={weapon} />;
        })}
      </div>
    </div>
  );
};

export default Inventory;
