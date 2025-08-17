"use client";

import { HoverImage } from "@/components/commons/HoverImage"; // <-- tu componente

export default function Home() {
  return (
    <main className="flex items-center justify-center p-4">
      <div className="relative mx-auto w-full max-w-[1200px] aspect-[1084/763] overflow-hidden rounded-2xl border-0 shadow">
        {/* Profile */}
        <HoverImage
          src="/img/menu/avatar.svg"
          activeSrc="/img/menu/avatar-active.png"
          alt="Profile / Robot"
          width={450}
          height={500}
          className="absolute z-30"
          style={{ left: "5%", bottom: "1%" }}
        />

        {/* Hangar */}
        <HoverImage
          src="/img/menu/hangar.svg"
          activeSrc="/img/menu/hangar-active.png"
          alt="Hangar"
          width={380}
          height={320}
          className="absolute z-20"
          style={{ right: "19%", bottom: "24%" }}
        />

        {/* Inventory */}
        <HoverImage
          src="/img/menu/inventory.svg"
          activeSrc="/img/menu/inventory-active.png"
          alt="Inventory"
          width={220}
          height={160}
          className="absolute z-20"
          style={{ right: "40%", bottom: "14%" }}
        />

        {/* Store */}
        <HoverImage
          src="/img/menu/store.svg"
          activeSrc="/img/menu/store-active.png"
          alt="Store"
          width={190}
          height={130}
          className="absolute z-20"
          style={{ right: "48%", bottom: "30%" }}
        />
      </div>
    </main>
  );
}
