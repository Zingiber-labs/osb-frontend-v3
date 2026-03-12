"use client";

import Image from "next/image";

type Props = {
  name: string;
  result: "success" | "failure";
  date: string;
  image?: string;
  xp?: number;
  coins?: number;
  gems?: number;
  shipUsed?: string;
  rankLabel?: string;
};

export default function MissionCard({
  name,
  result,
  date,
  image = "/images/missions/default.png",
  xp = 0,
  coins = 0,
  gems = 0,
  shipUsed,
  rankLabel = "S RANK",
}: Props) {
  const isSuccess = result === "success";

  return (
    <div
      className={[
        "rounded-[20px] border bg-[#11181D] p-3 sm:p-4",
        "border-secondary-cyan/50 shadow-[0_0_14px_rgba(59,231,255,0.28)]",
        "grid gap-4 items-center",
        "grid-cols-[76px_1fr]",
        "lg:grid-cols-[96px_minmax(0,1.8fr)_0.8fr_1.2fr_0.8fr]",
      ].join(" ")}
    >
      <div className="h-[76px] w-[76px] overflow-hidden rounded-[18px] border border-secondary-cyan/60 shadow-[0_0_10px_rgba(59,231,255,0.35)] lg:h-[96px] lg:w-[96px]">
        <Image
          src={image}
          alt={name}
          width={96}
          height={96}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-white sm:text-xl lg:text-[22px]">
          {name}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-[#70E37C] sm:text-base">
            {isSuccess ? "SUCCESS" : "FAILURE"}
          </span>

          {isSuccess && (
            <>
              <span className="text-[#70E37C]/80">•</span>
              <span className="text-sm font-semibold uppercase tracking-wide text-[#70E37C] sm:text-base">
                {rankLabel}
              </span>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="mt-4 space-y-3 lg:hidden">
          <Meta
            label="Result"
            value={isSuccess ? "SUCCESS" : "FAILURE"}
            valueClass={
              isSuccess ? "text-primary-orange" : "text-primary-orange"
            }
          />

          <RewardsCard xp={xp} coins={coins} gems={gems} compact />

          <Meta
            label="Ship used"
            value={shipUsed || date}
            valueClass="text-white"
          />
        </div>
      </div>

      <div className="hidden lg:block">
        <p className="text-sm text-white/85">Result</p>
        <p className="mt-1 text-[18px] font-semibold text-primary-orange">
          {isSuccess ? "SUCCESS" : "FAILURE"}
        </p>
      </div>

      <div className="hidden lg:block">
        <RewardsCard xp={xp} coins={coins} gems={gems} />
      </div>

      <div className="hidden lg:block">
        <p className="text-sm text-white/85">Ship used</p>
        <p className="mt-1 text-[18px] font-semibold text-white">
          {shipUsed || date}
        </p>
      </div>
    </div>
  );
}

function RewardsCard({
  xp,
  coins,
  gems,
  compact = false,
}: {
  xp: number;
  coins: number;
  gems: number;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl bg-[#4B636D]/85 text-white",
        compact ? "p-3" : "min-w-[320px] p-4",
      ].join(" ")}
    >
      <p className="mb-2 text-center text-sm font-medium text-white/95 sm:text-base">
        Rewards
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <div className="text-[22px] font-semibold text-[#8AE59B]">
          + {xp} EXP
        </div>

        <div className="flex items-center gap-2">
          <Image src="/img/coin.svg" alt="Coin" width={30} height={30} />
          <span className="text-sm">{coins}</span>
        </div>
        <div className="flex items-center gap-2">
          <Image src="/img/gem.svg" alt="Gem" width={30} height={30} />
          <span className="text-sm">{gems}</span>
        </div>
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-white/70">{label}</p>
      <p
        className={`truncate text-sm font-semibold ${valueClass ?? "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
