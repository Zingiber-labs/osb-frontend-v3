"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InventoryCard from "@/components/inventory/InventoryCard";
import InventoryDetail from "@/components/inventory/InventoryDetail";
import { useMyInventory } from "@/hooks/inventory/useMyInventory";
import { ItemType, MyInventory } from "@/types/inventory-items";

const Inventory = () => {
  const [selectedInventory, setSelectedInventory] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<ItemType | undefined>();

  const { data, isLoading, error } = useMyInventory({ type: selectedType });

  const handleInventoryDetail = (inventory: any) => {
    const newSelection =
      selectedInventory?.id === inventory.id ? null : inventory;

    setSelectedInventory(newSelection);

    if (newSelection) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCloseInventoryDetail = () => {
    setSelectedInventory(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="px-4">
        <p className="text-secondary text-5xl font-bold mt-14 mb-6">
          My inventory
        </p>
        <div className="mt-20 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-orange-24 rounded-lg p-4 animate-pulse"
            >
              <div className="bg-gray-600 rounded-lg h-20 mb-4"></div>
              <div className="h-6 bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-4">
        <p className="text-secondary text-5xl font-bold mt-14 mb-6">
          My inventory
        </p>
        <div className="mt-20 mb-8 text-center">
          <div className="text-red-500 text-xl font-bold mb-2">
            Failed to load inventory
          </div>
          <p className="text-gray-400">
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  // No data state
  if (!data?.items || data.items.length === 0) {
    return (
      <div className="px-4">
        <p className="text-secondary text-5xl font-bold mt-14 mb-6">
          My inventory
        </p>
        <div className="mt-20 mb-8 text-center">
          <div className="text-gray-500 text-xl font-bold mb-2">
            No items in inventory
          </div>
          <p className="text-gray-400">Visit the store to purchase items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <p className="text-secondary text-5xl font-bold mt-14 mb-6">
        My inventory
      </p>
      <p className="text-white text-sm normal-case mt-10">Select Item Types</p>
      <div className="mt-4 flex justify-between">
        <Select
          value={selectedType}
          onValueChange={(v) => setSelectedType(v as ItemType)}
        >
          <SelectTrigger className="w-[300px] text-white bg-orange-dark cursor-pointer">
            <SelectValue className="text-white" placeholder="Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="SKIN">Skin</SelectItem>
              <SelectItem value="REWARD">Reward</SelectItem>
              <SelectItem value="UPGRADE">Upgrade</SelectItem>
              <SelectItem value="BOOSTER">Booster</SelectItem>
              <SelectItem value="PART">Part</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {selectedInventory && (
        <InventoryDetail
          inventory={selectedInventory}
          onClose={handleCloseInventoryDetail}
        />
      )}

      <div className="mt-20 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data?.items.map((inventory: MyInventory) => (
          <InventoryCard
            key={inventory.id}
            inventory={inventory}
            onClick={handleInventoryDetail}
            isSelected={selectedInventory?.id === inventory.id}
          />
        ))}
      </div>
    </div>
  );
};

export default Inventory;
