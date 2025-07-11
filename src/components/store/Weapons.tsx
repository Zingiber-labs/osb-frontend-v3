"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import Button from "../button/Button";
import Image from "next/image";

const Weapons = () => {
  const weapons = [
    {
      name: "BLUE ORB",
      description: "50% extra power",
      price: "$45",
      src:"/img/gun.svg"
    },
    {
      name: "BLUE SHIELD",
      description: "40% damage resistance",
      price: "$45",
      src:"/img/gun.svg"
    },
    {
      name: "RED SWORD",
      description: "60% critical hit chance",
      price: "$75",
      src:"/img/gun.svg"
    },
    {
      name: "GREEN BOW",
      description: "30% increased accuracy",
      price: "$55",
      src:"/img/gun.svg"
    },
    {
      name: "BLACK AXE",
      description: "70% armor penetration",
      price: "$85",
      src:"/img/gun.svg"
    },
    {
      name: "GOLDEN STAFF",
      description: "100% magic boost",
      price: "$120",
      src:"/img/gun.svg"
    },
    {
      name: "GREEN BOW",
      description: "30% increased accuracy",
      price: "$55",
      src:"/img/gun.svg"
    },
    {
      name: "BLACK AXE",
      description: "70% armor penetration",
      price: "$85",
      src:"/img/gun.svg"
    },
    {
      name: "GOLDEN STAFF",
      description: "100% magic boost",
      price: "$120",
      src:"/img/gun.svg"
    },
  ];

  return (
    <div className="h-screen flex flex-col">
      <h1 className="text-2xl font-normal mb-4 text-secondary-cyan tracking-[33px]">
        WEAPONS
      </h1>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {weapons.map((weapon, index) => (
          <Card
            key={index}
            className="bg-orange-24 hover:shadow-lg transition-shadow text-white font-bold border-0"
          >
            <CardHeader>
              <div className="bg-card-bg rounded-lg flex justify-center py-5">
                <Image
                  src={weapon.src || ""}
                  alt={weapon.name}
                  width={108}
                  height={60}
                  className="object-contain"
                />
              </div>
              <CardTitle className="text-2xl">{weapon.name}</CardTitle>
              <CardDescription className="text-lg text-white font-light">
                {weapon.description}
              </CardDescription>
            </CardHeader>

            <CardFooter className="gap-8">
              <p className="text-2xl font-bold ">{weapon.price}</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                ADD TO CARD
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Weapons;
