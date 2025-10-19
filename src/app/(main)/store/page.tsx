"use client";

import Banner from "@/components/banner/Banner";
import Weapons from "@/components/store/Weapons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { ItemType } from "@/types/inventory-items";

const Store = () => {
  const [selectedType, setSelectedType] = useState<ItemType | undefined>();

  const banners = [
    {
      taglinePrimary: "BEST",
      taglineSecondary: "WEAPON",
      title: "Blue Orb",
      description:
        "Lorem ipsum dolor sit amet consectetur. Diam risus odio non magna volutpat gravida malesuada.",
      imageUrl: "/img/banner.png",
      contentImageUrl: "/img/gun.svg",
    },
    {
      taglinePrimary: "NEW",
      taglineSecondary: "SHIP",
      title: "Falcon X",
      description:
        "Conquer the galaxy with speed and firepower. The Falcon X is unmatched in aerial battles.",
      imageUrl: "/img/banner.png",
      contentImageUrl: "/img/gun.svg",
    },
    {
      taglinePrimary: "ULTIMATE",
      taglineSecondary: "SKILL",
      title: "Stealth Mode",
      description:
        "Disappear from your enemies’ radar and strike with precision when they least expect it.",
      imageUrl: "/img/banner.png",
      contentImageUrl: "/img/gun.svg",
    },
  ];

  return (
    <div className="pt-8 gap-8 px-4">
      <Swiper
        modules={[Pagination, Autoplay]}
        navigation
        pagination={{ clickable: false }}
        autoplay={{ delay: 4000 }}
        loop
        className="w-full"
      >
        {banners.map((banner, idx) => (
          <SwiperSlide key={idx}>
            <Banner {...banner} showTagline overlayClassName="bg-transparent" />
          </SwiperSlide>
        ))}
      </Swiper>

      <p className="text-white text-sm normal-case mt-10">
        Select Item Types
      </p>
      <div className="mt-4 flex justify-between">
        <Select
          value={selectedType}
          onValueChange={(v) => setSelectedType(v as ItemType)}
        >
          <SelectTrigger className="w-[300px] text-white bg-orange-dark cursor-pointer">
            <SelectValue className="text-white" placeholder="Type" />
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

        <div className="relative w-[300px]">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 size-4 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search"
            className="pl-8 bg-orange-24 text-white"
          />
        </div>
      </div>
      <Weapons type={selectedType} />
    </div>
  );
};

export default Store;
