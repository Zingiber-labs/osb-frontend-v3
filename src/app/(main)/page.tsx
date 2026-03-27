"use client";

import { AuthPanel } from "@/components/auth/AuthStatus";
import { HoverImage } from "@/components/commons/HoverImage";
import FloatingActionButton from "@/components/home/FloatingActionButton";
import WeekEventsModal from "@/components/home/WeekEventModal";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Bell, CalendarDays } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type EventItem = {
  id: number;
  name: string;
  date: string;
  description?: string;
};

const mockEvents: EventItem[] = [
  {
    id: 1,
    name: "EVENT NAME",
    date: "04/16/2026",
    description: "Event details",
  },
  {
    id: 2,
    name: "EVENT NAME",
    date: "04/16/2026",
    description: "Event details",
  },
  {
    id: 3,
    name: "EVENT NAME",
    date: "04/16/2026",
    description: "Event details",
  },
  {
    id: 4,
    name: "EVENT NAME",
    date: "04/16/2026",
    description: "Event details",
  },
  {
    id: 5,
    name: "EVENT NAME",
    date: "04/16/2026",
    description: "Event details",
  },
];

export default function Home() {
  const isMobile = useIsMobile(1200);
  const [isEventsOpen, setIsEventsOpen] = useState(false);

  return (
    <div className="relative mx-auto min-h-[calc(100dvh-104px-91.83px)] w-full overflow-hidden rounded-2xl border-0 shadow">
      {isMobile ? (
        <>
          <div className="mx-auto flex max-w-md w-full flex-col gap-4 px-4 py-16 text-white">
            <Link href="/missions" passHref>
              <Button
                variant="outline"
                className="h-[72px] w-full justify-start gap-3 border-primary bg-[#FF6B2F3D] text-lg text-orange"
              >
                <Image
                  src="/img/menu/hangar.svg"
                  alt="Hangar"
                  width={50}
                  height={50}
                />
                <p className="text-3xl">HANGAR</p>
              </Button>
            </Link>

            <Link href="/inventory" passHref>
              <Button
                variant="outline"
                className="h-[72px] w-full justify-start gap-3 border-primary bg-[#FF6B2F3D] text-lg text-orange"
              >
                <Image
                  src="/img/menu/inventory.svg"
                  alt="Inventory"
                  width={50}
                  height={50}
                />
                <p className="text-3xl">INVENTORY</p>
              </Button>
            </Link>

            <Link href="/store" passHref>
              <Button
                variant="outline"
                className="h-[72px] w-full justify-start gap-3 border-primary bg-[#FF6B2F3D] text-lg text-orange"
              >
                <Image
                  src="/img/menu/store.svg"
                  alt="Store"
                  width={50}
                  height={50}
                />
                <p className="text-3xl">STORE</p>
              </Button>
            </Link>

            <Link href="/profile" passHref>
              <Button
                variant="outline"
                className="h-[72px] w-full justify-start gap-3 border-primary bg-[#FF6B2F3D] text-lg text-orange"
              >
                <Image
                  src="/img/menu/avatar2.png"
                  alt="Profile"
                  width={50}
                  height={50}
                />
                <p className="text-3xl">PROFILE</p>
              </Button>
            </Link>
          </div>

          {/* Floating buttons mobile */}
          <div className="absolute bottom-4 left-4 z-40 flex gap-3">
            <FloatingActionButton
              ariaLabel="Open events"
              onClick={() => setIsEventsOpen(true)}
              icon={<CalendarDays className="h-5 w-5 text-white" />}
            />

            <FloatingActionButton
              ariaLabel="Notifications"
              onClick={() => console.log("notifications")}
              icon={<Bell className="h-5 w-5 text-white" />}
            />
          </div>
        </>
      ) : (
        <>
          <AuthPanel />

          <HoverImage
            src="/img/menu/avatar-v2.svg"
            activeSrc="/img/menu/avatar-active.png"
            alt="Profile / Robot"
            width={350}
            height={400}
            className="absolute z-30"
            href="/profile"
            style={{ left: "6%", bottom: "0%" }}
            tooltipOffset={0}
          />

          <HoverImage
            src="/img/menu/hangar-v2.svg"
            activeSrc="/img/menu/hangar-active.png"
            alt="Hangar"
            width={380}
            height={320}
            className="absolute z-20"
            href="/missions"
            style={{ right: "19%", bottom: "15%" }}
            tooltipOffset={-70}
          />

          <HoverImage
            src="/img/menu/inventory-v2.svg"
            activeSrc="/img/menu/inventory-active.png"
            alt="Inventory"
            width={220}
            height={160}
            className="absolute z-20"
            href="/inventory"
            style={{ right: "40%", bottom: "1%" }}
          />

          <HoverImage
            src="/img/menu/store-v2.svg"
            activeSrc="/img/menu/store-active.png"
            alt="Store"
            width={190}
            height={130}
            className="absolute z-20"
            href="/store"
            style={{ right: "48%", bottom: "20%" }}
          />

          <HoverImage
            src="/img/menu/exit-v2.svg"
            activeSrc="/img/menu/exit-active.png"
            alt="Exit"
            width={100}
            height={30}
            className="absolute z-20"
            style={{ right: "4%", bottom: "69%" }}
            tooltipOffset={0}
            onClick={() => signOut({ callbackUrl: "/" })}
          />

          {/* Floating buttons desktop */}
          <div className="absolute bottom-[18%] left-[3.5%] z-40 flex flex-col gap-4">
            <FloatingActionButton
              ariaLabel="Open events"
              onClick={() => setIsEventsOpen(true)}
              icon={<CalendarDays className="h-6 w-6 text-white" />}
            />

            <FloatingActionButton
              ariaLabel="Notifications"
              onClick={() => console.log("notifications")}
              icon={<Bell className="h-6 w-6 text-white" />}
            />
          </div>
        </>
      )}

      <WeekEventsModal
        open={isEventsOpen}
        onClose={() => setIsEventsOpen(false)}
        events={mockEvents}
      />
    </div>
  );
}
