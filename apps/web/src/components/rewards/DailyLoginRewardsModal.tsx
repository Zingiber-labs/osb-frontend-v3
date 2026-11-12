"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import RewardCard from "./RewardCard";
import { EventsResponseItem } from "@/types/event";

export type DailyReward = {
  day: number;
  amount: number;
  claimed?: boolean;
  status?: "AVAILABLE" | "CLAIMED" | "LOCKED" | "COMPLETED" | string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  subtitle?: string;
  rewards: DailyReward[];
  activeDay: number | null;
  isLastEvent?: boolean;
  onViewEvent?: () => void;
  onRewardClick?: (day: number) => void;
  isClaimLoading: boolean;
  currentEvent: EventsResponseItem | null;
};

const MAX_GRID_REWARDS = 7;

export function DailyLoginRewardsModal({
  open,
  onOpenChange,
  title = "DAILY LOGIN REWARDS",
  subtitle = "Rewards claimed!",
  rewards,
  activeDay,
  isLastEvent = false,
  onViewEvent,
  onRewardClick,
  isClaimLoading = false,
  currentEvent,
}: Props) {
  const router = useRouter();
  // 767.98 rather than 767: the previous useIsMobile() compared the integer
  // window.innerWidth against 768, so a fractional viewport (produced by a
  // non-1.0 devicePixelRatio or browser zoom) truncated down and counted as
  // mobile. `max-width: 767px` evaluates the un-truncated width and would not.
  // The .98 keeps the two behaviourally identical at every reachable width.
  const isMobile = useMediaQuery("(max-width: 767.98px)");
  const safeRewards = rewards?.length ? rewards : [];

  const shouldUseCarousel = isMobile || safeRewards.length > MAX_GRID_REWARDS;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Close"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative mx-auto flex h-full w-full items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-275 overflow-hidden rounded-2xl border border-orange-400/50 bg-linear-to-br from-[#2d1710]/95 via-[#160d0b]/95 to-[#080506]/95 shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,114,45,0.25),transparent_38%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%)]" />

          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 z-10 rounded-full p-2 text-cyan-200/90 hover:bg-white/10 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative px-4 pb-5 pt-6 sm:px-8 sm:pb-7 sm:pt-8">
            <div className="text-center">
              <h2 className="text-base tracking-[0.28em] text-cyan-300 sm:text-lg">
                {title}
              </h2>
              <p className="mt-2 text-sm text-white/75 sm:text-base">
                {subtitle}
              </p>
            </div>

            <div className="mt-6 sm:mt-7">
              {shouldUseCarousel ? (
                <div className="daily-rewards-swiper px-1 sm:px-8">
                  <Swiper
                    modules={[Navigation, Pagination]}
                    spaceBetween={12}
                    slidesPerView={1}
                    navigation
                    pagination={{ clickable: true }}
                    breakpoints={{
                      640: { slidesPerView: 3, spaceBetween: 14 },
                      768: { slidesPerView: 5, spaceBetween: 16 },
                      1024: { slidesPerView: 7, spaceBetween: 16 },
                    }}
                    className="w-full"
                  >
                    {safeRewards.map((r) => (
                      <SwiperSlide key={r.day} className="h-auto">
                        <RewardCard
                          reward={r}
                          activeDay={activeDay}
                          onRewardClick={onRewardClick}
                          isLoading={isClaimLoading}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              ) : (
                <div
                  className="mx-auto grid items-end justify-center gap-3 sm:gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${safeRewards.length}, minmax(0, 150px))`,
                  }}
                >
                  {safeRewards.map((r) => (
                    <RewardCard
                      key={r.day}
                      reward={r}
                      activeDay={activeDay}
                      onRewardClick={onRewardClick}
                      isLoading={isClaimLoading}
                      currentEvent={currentEvent}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  if (isLastEvent) {
                    onOpenChange(false);
                    router.push("/profile?tab=my-events");
                    return;
                  }

                  onViewEvent?.();
                }}
                className="rounded-full bg-cyan-300 px-10 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 sm:text-base"
              >
                {isLastEvent ? "My Events" : "Next Event"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
