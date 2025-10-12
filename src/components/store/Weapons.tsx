"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import WeaponPreview from "./WeaponPreview";
import { useState } from "react";
import { useStoreItems } from "@/hooks/store-page/useStoreItems";
import { StoreItem } from "@/types/store-items";
import { Minus, Plus } from "lucide-react";
import { ItemType } from "@/types/inventory-items";

const Weapons = ({ type }: { type?: ItemType }) => {
  const [open, setOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<StoreItem | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data, isLoading, error } = useStoreItems({ type });

  const inc = (id: string) =>
    setQuantities((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const dec = (id: string) =>
    setQuantities((p) => ({ ...p, [id]: Math.max((p[id] || 0) - 1, 0) }));

  const handleOpenDialog = (weapon: StoreItem) => {
    setSelectedWeapon(weapon);
    setOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col mt-6 mb-6">
        <div className="flex-1 overflow-y-auto custom-scroll-thin pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card
                key={index}
                className="bg-orange-24 text-white font-bold border-2 border-transparent animate-pulse"
              >
                <CardHeader>
                  <div className="bg-card-bg rounded-lg flex justify-center py-5 h-20"></div>
                  <div className="h-8 bg-gray-600 rounded"></div>
                  <div className="h-6 bg-gray-600 rounded w-3/4"></div>
                </CardHeader>
                <CardFooter className="gap-8 justify-between">
                  <div className="h-8 bg-gray-600 rounded w-16"></div>
                  <div className="h-10 bg-gray-600 rounded w-24"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex flex-col mt-6 mb-6">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <h3 className="text-xl font-bold mb-2">Failed to load weapons</h3>
            <p className="text-gray-400">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data?.items || data.items.length === 0) {
    return (
      <div className="h-screen flex flex-col mt-6 mb-6">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <h3 className="text-xl font-bold mb-2">No weapons available</h3>
            <p className="text-gray-400">Check back later for new items</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col mt-6 mb-6">
      <div className="flex-1 overflow-y-auto custom-scroll-thin pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.items?.map((item: StoreItem) => (
            <Card
              key={item.id}
              className="py-2 group bg-orange-24 hover:shadow-lg transition-shadow text-white font-bold border-2 border-transparent hover:bg-transparent hover:border-secondary duration-300 cursor-pointer flex flex-col"
              onClick={() => handleOpenDialog(item)}
            >
              <CardHeader className="px-2">
                <div className="bg-card-bg rounded-lg flex justify-center py-5">
                  <Image
                    src={"/img/gun.svg"}
                    alt={item.name}
                    width={108}
                    height={60}
                    className="object-contain"
                  />
                </div>

                <div>
                  <CardTitle className="text-xl">{item.name}</CardTitle>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <CardDescription className="text-xs text-white font-light">
                      {item.description}
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      <button
                        aria-label="Decrease quantity"
                        className="grid place-items-center w-5 h-5 rounded-full border-2 border-white/90 text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          dec(item.id);
                        }}
                      >
                        <Minus className="w-3 h-3 stroke-[3]" />
                      </button>
                      <span className="w-4 text-center text-sm">
                        {quantities[item.id] || 0}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        className="grid place-items-center w-5 h-5 rounded-full border-2 border-white/90 text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          inc(item.id);
                        }}
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardFooter className="mt-auto gap-8 justify-between px-2">
                <p className="text-2xl font-bold">${item.price || 0}</p>
                <Button className="bg-black text-white rounded-full w-fit hover:bg-secondary hover:text-black group-hover:bg-cyan-400 group-hover:text-black transition-colors duration-300">
                  BUY ITEM
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {selectedWeapon && (
        <WeaponPreview
          open={open}
          onOpenChange={setOpen}
          weapon={selectedWeapon}
          quantity={quantities[selectedWeapon.id] || 0}
          onIncrease={() => inc(selectedWeapon.id)}
          onDecrease={() => dec(selectedWeapon.id)}
        />
      )}
    </div>
  );
};

export default Weapons;
