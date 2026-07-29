"use client";

import { AuthPanel } from "@/components/auth/AuthStatus";
import { HoverImage } from "@/components/commons/HoverImage";
import AvailableEvents from "@/components/home/AvailableEvents";
import FloatingActionButton from "@/components/home/FloatingActionButton";
import HomeScene from "@/components/home/HomeScene";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useComplexEvents } from "@/hooks/events-complex/useEvents";
import { useUnreadCount } from "@/hooks/notifications/useNotifications";
import { Bell, CalendarDays, Trophy } from "lucide-react";
import { useLogout } from "@/lib/auth/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const fabTooltipClass =
  "bg-orange-dark text-white border border-primary-orange/70 shadow-[0_0_12px_rgba(255,107,47,0.35)] font-apex tracking-wide [&_svg]:bg-orange-dark [&_svg]:fill-orange-dark";

export default function Home() {
  const router = useRouter();
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { data: events, isLoading: isEventsLoading } = useComplexEvents();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unreadCount ?? 0;
  const logout = useLogout();

  return (
    // The desktop min-height is required, not decorative: every child of the
    // desktop tree is absolutely or fixed positioned, so without it this block
    // collapses to 0px and the percentage `bottom` offsets (avatar, exit, FAB
    // column) resolve against nothing and render off the top of the screen.
    // Scoped to desktop: the mobile tree is in normal flow and sizes itself,
    // which is why the old unscoped version had the wrong footer constant.
    <div className="relative mx-auto w-full overflow-auto rounded-2xl border-0 shadow thin-scroll desktop:min-h-[calc(100dvh-104px-91.83px)]">
      <div className="desktop:hidden">
          <div className="mx-auto flex max-w-md w-full flex-col gap-4 px-4 pt-16 pb-32 text-white">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <FloatingActionButton
                  ariaLabel="Open events"
                  onClick={() => setIsEventsOpen(true)}
                  icon={<CalendarDays className="h-5 w-5 text-white" />}
                />
              </TooltipTrigger>
              <TooltipContent className={fabTooltipClass}>Events</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <FloatingActionButton
                  ariaLabel="Leaderboard"
                  onClick={() => router.push("/ranking")}
                  icon={<Trophy className="h-5 w-5 text-white" />}
                />
              </TooltipTrigger>
              <TooltipContent className={fabTooltipClass}>Leaderboard</TooltipContent>
            </Tooltip>

            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <FloatingActionButton
                    ariaLabel="Notifications"
                    onClick={() => setIsNotifOpen(true)}
                    icon={<Bell className="h-5 w-5 text-white" />}
                  />
                </TooltipTrigger>
                <TooltipContent className={fabTooltipClass}>Notifications</TooltipContent>
              </Tooltip>
              {unreadCount > 0 && (
                <span
                  className="pointer-events-none absolute -top-1 -right-1 min-w-[20px] h-5 px-1
                    flex items-center justify-center rounded-full
                    text-white text-[10px] font-extrabold z-10 animate-pulse"
                  style={{
                    background:
                      "linear-gradient(135deg, #ff3b00 0%, #ff6b2f 100%)",
                    boxShadow:
                      "0 0 10px rgba(255,60,0,0.7), 0 0 4px rgba(255,60,0,0.5)",
                    border: "1.5px solid rgba(255,150,100,0.5)",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          </div>
      </div>

      <div className="hidden desktop:block">
          {/* No JS gate. These used to be wrapped in `isDesktop && …` because
              `display: none` does not stop SVG <image href> or a next/image
              `priority` preload from downloading. Both now use assets that ARE
              skipped while hidden — CSS backgrounds in HomeScene, lazy loading
              in AuthPanel — so rendering them unconditionally costs phones
              nothing and restores desktop's server-rendered first paint. */}
          <HomeScene />

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
            src="/img/menu/exit-v2.svg"
            activeSrc="/img/menu/exit-active.png"
            alt="Exit"
            width={100}
            height={30}
            className="absolute z-20"
            style={{ right: "4%", bottom: "69%" }}
            tooltipOffset={0}
            onClick={() =>
              logout.mutate(undefined, {
                onSettled: () => {
                  router.push("/login");
                  router.refresh();
                },
              })
            }
          />

          {/* Floating buttons desktop */}
          <div className="absolute bottom-[18%] left-[3.5%] z-40 flex flex-col gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <FloatingActionButton
                  ariaLabel="Open events"
                  onClick={() => setIsEventsOpen(true)}
                  icon={<CalendarDays className="h-6 w-6 text-white" />}
                />
              </TooltipTrigger>
              <TooltipContent side="right" className={fabTooltipClass}>Events</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <FloatingActionButton
                  ariaLabel="Leaderboard"
                  onClick={() => router.push("/ranking")}
                  icon={<Trophy className="h-6 w-6 text-white" />}
                />
              </TooltipTrigger>
              <TooltipContent side="right" className={fabTooltipClass}>Leaderboard</TooltipContent>
            </Tooltip>

            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <FloatingActionButton
                    ariaLabel="Notifications"
                    onClick={() => setIsNotifOpen(true)}
                    icon={<Bell className="h-6 w-6 text-white" />}
                  />
                </TooltipTrigger>
                <TooltipContent side="right" className={fabTooltipClass}>Notifications</TooltipContent>
              </Tooltip>
              {unreadCount > 0 && (
                <span
                  className="pointer-events-none absolute -top-1 -right-1 min-w-[20px] h-5 px-1
                    flex items-center justify-center rounded-full
                    text-white text-[10px] font-extrabold z-10 animate-pulse"
                  style={{
                    background:
                      "linear-gradient(135deg, #ff3b00 0%, #ff6b2f 100%)",
                    boxShadow:
                      "0 0 12px rgba(255,60,0,0.75), 0 0 5px rgba(255,60,0,0.5)",
                    border: "1.5px solid rgba(255,150,100,0.5)",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          </div>
      </div>

      <AvailableEvents
        open={isEventsOpen}
        onClose={() => setIsEventsOpen(false)}
        events={events || []}
        isLoading={isEventsLoading}
      />

      <NotificationPanel
        open={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </div>
  );
}
