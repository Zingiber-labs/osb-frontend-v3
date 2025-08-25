"use client";

import { HoverImage } from "@/components/commons/HoverImage";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const isMobile = useIsMobile();

  return (
    <div className="relative mx-auto w-full max-w-[1200px] overflow-hidden rounded-2xl border-0 shadow min-h-[calc(100dvh-104px-91.83px)]">
      <AuthStatus />

      {isMobile ? (
        <div className="flex flex-col gap-4 py-16 px-4 max-w-md mx-auto w-full text-white">
          <Link href="/hangar" passHref>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-lg h-[72] text-orange bg-[#FF6B2F3D] border-primary"
            >
              <Image
                src="/img/menu/hangar.svg"
                alt="Profile / Robot"
                width={50}
                height={50}
              />
               <p className="text-3xl">HANGAR</p>
            </Button>
          </Link>
          <Link href="/inventory" passHref>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-lg h-[72] text-orange bg-[#FF6B2F3D] border-primary"
            >
              <Image
                src="/img/menu/inventory.svg"
                alt="Profile / Robot"
                width={50}
                height={50}
              /> <p className="text-3xl">INVENTORY</p>
            </Button>
          </Link>
          <Link href="/store" passHref>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-lg h-[72] text-orange bg-[#FF6B2F3D] border-primary"
            >
              <Image
                src="/img/menu/store.svg"
                alt="Profile / Robot"
                width={50}
                height={50}
              /> <p className="text-3xl">STORE</p>
            </Button>
          </Link>
          <Link href="/login" passHref>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-lg h-[72] text-orange bg-[#FF6B2F3D] border-primary"
            >
              <Image
                src="/img/menu/avatar2.png"
                alt="Profile / Robot"
                width={50}
                height={50}
              /> <p className="text-3xl">PROFILE</p>
            </Button>
          </Link>
          <Link href="/guest" passHref>
            <span className="text-cyan-400 text-sm mt-4 hover:underline">
              Play as a guest
            </span>
          </Link>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
