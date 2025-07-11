'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Button from "../button/Button";

const Weapons = () => {
  const weapons = [
    {
      name: "BLUE ORB",
      description: "50% extra power",
      price: "$45",
    },
    {
      name: "BLUE SHIELD",
      description: "40% damage resistance",
      price: "$45",
    },
    {
      name: "RED SWORD",
      description: "60% critical hit chance",
      price: "$75",
    },
    {
      name: "GREEN BOW",
      description: "30% increased accuracy",
      price: "$55",
    },
    {
      name: "BLACK AXE",
      description: "70% armor penetration",
      price: "$85",
    },
    {
      name: "GOLDEN STAFF",
      description: "100% magic boost",
      price: "$120",
    },
    {
      name: "GREEN BOW",
      description: "30% increased accuracy",
      price: "$55",
    },
    {
      name: "BLACK AXE",
      description: "70% armor penetration",
      price: "$85",
    },
    {
      name: "GOLDEN STAFF",
      description: "100% magic boost",
      price: "$120",
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
            className="bg-orange-24 hover:shadow-lg transition-shadow text-white font-bold"
          >
            <CardHeader>
              <CardTitle className="text-2xl">{weapon.name}</CardTitle>
              <CardDescription className="text-lg text-white font-light">
                {weapon.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-2xl font-bold ">{weapon.price}</p>
            </CardContent>

            <CardFooter>
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