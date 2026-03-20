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
  onClick?: () => void;
};

export default function MissionCard({
  name,
  result,
  date,
  image = "/img/missions.png",
  xp = 0,
  coins = 0,
  gems = 0,
  shipUsed,
  rankLabel = "S RANK",
  onClick,
}: Props) {
  const isSuccess = result === "success";

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full text-left
        rounded-[20px] border bg-[#11181D] p-3 sm:p-4
        border-secondary-cyan/50 shadow-[0_0_14px_rgba(59,231,255,0.28)]
        grid gap-4 items-center
        grid-cols-[76px_1fr]
        lg:grid-cols-[96px_minmax(0,1.8fr)_0.8fr_1.2fr_0.8fr]
        transition-transform hover:scale-[1.01]
      "
    >
      <div className="h-16 w-16 overflow-hidden rounded-[14px] border border-secondary-cyan/60 shadow-[0_0_10px_rgba(59,231,255,0.35)] sm:h-[76px] sm:w-[76px] lg:h-[96px] lg:w-[96px]">
        <Image
          src={image}
          alt={name}
          width={96}
          height={96}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-white sm:text-lg lg:text-[22px]">
          {name}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* <span className="text-xs font-semibold uppercase tracking-wide text-[#70E37C] sm:text-sm">
            {isSuccess ? "SUCCESS" : "FAILURE"}
          </span> */}

          <>
            {/* <span className="text-[#70E37C]/80 text-xs sm:text-sm">•</span> */}
            <span className="text-xs font-semibold uppercase tracking-wide text-[#70E37C] sm:text-sm">
              {rankLabel}
            </span>
          </>
        </div>

        <div className="mt-3 space-y-2 lg:hidden">
          <Meta
            label="Result"
            value={isSuccess ? "SUCCESS" : "FAILURE"}
            valueClass={isSuccess ? "text-[#70E37C]" : "text-[#FF7B6B]"}
          />

          <div className="flex flex-col items-start">
            <RewardsCard xp={xp} coins={coins} gems={gems} compact />
          </div>

          <Meta
            label="Ship used"
            value={shipUsed || date}
            valueClass="text-white"
          />
        </div>
      </div>

      <div className="hidden lg:block min-w-0">
        <p className="text-sm text-white/85">Result</p>
        <p
          className={`mt-1 text-[18px] font-semibold ${
            isSuccess ? "text-[#70E37C]" : "text-primary-orange"
          }`}
        >
          {isSuccess ? "SUCCESS" : "FAILURE"}
        </p>
      </div>

      <div className="hidden lg:block min-w-0">
        <RewardsCard xp={xp} coins={coins} gems={gems} compact />
      </div>

      <div className="hidden lg:block min-w-0">
        <p className="text-sm text-white/85">Ship used</p>
        <p className="mt-1 text-[18px] font-semibold text-white break-words">
          {shipUsed || date}
        </p>
      </div>
    </button>
  );
}

function RewardsCard({
  xp,
  coins,
  gems,
}: {
  xp: number;
  coins: number;
  gems: number;
  compact?: boolean;
}) {
  return (
    <>
      <p className="mb-2 text-center text-sm font-medium text-white/95">
        Rewards
      </p>
      <div className="mt-2 flex items-center gap-4">
        <div className="text-sm text-[#8AE59B]">+{xp} EXP</div>
        <div className="flex items-center gap-2">
          <Image src="/img/coin.svg" alt="Coin" width={14} height={14} />
          <span className="text-sm">{coins}</span>
        </div>
        <div className="flex items-center gap-2">
          <Image src="/img/gem.svg" alt="Gem" width={14} height={14} />
          <span className="text-sm">{gems}</span>
        </div>
      </div>
    </>
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
      <p className="text-sm text-white/70 sm:text-xs">{label}</p>
      <p
        className={`truncate text-xs font-semibold sm:text-sm ${valueClass ?? "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
