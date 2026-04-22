"use client";

import * as React from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { useIsMobile } from "@/hooks/useIsMobile";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

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
};

const MAX_GRID_REWARDS = 7;

function formatAmount(amount: number) {
  return `x${amount}`;
}

function RewardCard({
  reward,
  activeDay,
  onRewardClick,
}: {
  reward: DailyReward;
  activeDay: number | null;
  onRewardClick?: (day: number) => void;
}) {
  const isActive = activeDay !== null && reward.day === activeDay;

  const isClaimed =
    !!reward.claimed ||
    reward.status === "CLAIMED" ||
    reward.status === "COMPLETED";

  const isAvailable = reward.status === "AVAILABLE";
  const disabled = false;

  return (
    <div className="flex h-full flex-col items-center">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRewardClick?.(reward.day)}
        className={[
          "relative w-full rounded-xl p-3 sm:p-4 text-left",
          "bg-orange-24 border border-orange-500/80",
          "backdrop-blur transition",
          isActive
            ? "ring-2 ring-cyan-300/70 shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_25px_rgba(34,211,238,0.15)]"
            : "opacity-60",
          disabled
            ? "cursor-not-allowed"
            : "cursor-pointer hover:opacity-100",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={`Claim reward for day ${reward.day}`}
      >
        <div className="mx-auto flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-white">
          <Image
            src="/img/coin.svg"
            alt="Coin"
            width={40}
            height={40}
            className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] animate-bob"
          />
        </div>

        <div className="font-helvetica mt-2 text-center text-xs sm:text-sm font-semibold text-cyan-200">
          {formatAmount(reward.amount)}
        </div>

        {isClaimed && (
          <div className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white/80">
            Claimed
          </div>
        )}

        {!isClaimed && reward.status === "LOCKED" && (
          <div className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white/80">
            Locked
          </div>
        )}
      </button>

      <div
        className={[
          "mt-2 w-full text-center rounded-lg py-1.5",
          "text-sm sm:text-base font-semibold",
          isActive
            ? "bg-orange-24 text-white ring-1 ring-cyan-300/60"
            : "bg-orange-24 text-white/60",
        ].join(" ")}
      >
        day {reward.day}
      </div>
    </div>
  );
}

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
}: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const safeRewards = rewards?.length ? rewards : [];

  const shouldUseCarousel =
    isMobile || safeRewards.length > MAX_GRID_REWARDS;

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
        className="absolute inset-0 bg-black/60"
      />

      <div className="relative mx-auto flex h-full w-full items-center justify-center p-3 sm:p-6">
        <div
          className="
            relative w-full max-w-[1100px]
            overflow-hidden rounded-2xl
            border border-orange-500/80
            bg-gradient-to-b from-[#2a1b16]/90 via-[#1d1210]/85 to-[#120b0a]/90
            shadow-2xl
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-[#ff6b2f]/40" />

          <button
            onClick={() => onOpenChange(false)}
            className="
              absolute right-3 top-3
              rounded-full p-2
              text-cyan-200/90 hover:text-cyan-100
              hover:bg-white/5
              focus:outline-none focus:ring-2 focus:ring-cyan-300/50
            "
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="px-4 pb-5 pt-6 sm:px-8 sm:pb-7 sm:pt-8">
            <div className="text-center">
              <h2 className="text-base sm:text-lg tracking-widest text-cyan-300">
                {title}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-white/80">
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
                    navigation={!isMobile}
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
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              ) : (
                <div
                  className="mx-auto grid gap-3 sm:gap-4 items-end justify-center"
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
                    />
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
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
                className="
                  rounded-full px-10 py-3
                  text-sm sm:text-base font-semibold
                  text-black
                  bg-cyan-300 hover:bg-cyan-200
                  shadow-lg
                  focus:outline-none focus:ring-2 focus:ring-cyan-300/60
                "
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
