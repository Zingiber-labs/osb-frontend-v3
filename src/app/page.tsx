"use client";

import { HoverImage } from "@/components/commons/HoverImage";

export default function Home() {
  return (
      <div className="relative mx-auto w-full max-w-[1200px] overflow-hidden rounded-2xl border-0 shadow min-h-[calc(100dvh-104px-91.83px)]">
        {/* Profile */}
        <HoverImage
          src="/img/menu/avatar.svg"
          activeSrc="/img/menu/avatar-active.png"
          alt="Profile / Robot"
          width={350}
          height={400}
          className="absolute z-30"
          href="/profile"
          style={{ left: "5%", bottom: "0%" }}
        />

        {/* Hangar */}
        <HoverImage
          src="/img/menu/hangar.svg"
          activeSrc="/img/menu/hangar-active.png"
          alt="Hangar"
          width={380}
          height={320}
          className="absolute z-20"
          href="/hangar"
          style={{ right: "19%", bottom: "15%" }}
        />

        {/* Inventory */}
        <HoverImage
          src="/img/menu/inventory.svg"
          activeSrc="/img/menu/inventory-active.png"
          alt="Inventory"
          width={220}
          height={160}
          className="absolute z-20"
          href="/inventory"
          style={{ right: "40%", bottom: "1%" }}
        />

        {/* Store */}
        <HoverImage
          src="/img/menu/store.svg"
          activeSrc="/img/menu/store-active.png"
          alt="Store"
          width={190}
          height={130}
          className="absolute z-20"
          href="/store"
          style={{ right: "48%", bottom: "20%" }}
        />
      </div>
  );
}
