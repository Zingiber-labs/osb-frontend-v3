import { Check, Lock, X } from "lucide-react";
import Image from "next/image";

export type DailyReward = {
  day: number;
  amount: number;
  claimed?: boolean;
  status?: "AVAILABLE" | "CLAIMED" | "LOCKED" | "COMPLETED" | string;
};

function formatAmount(amount: number) {
  return `x${amount}`;
}

const RewardCard = ({
  reward,
  activeDay,
  onRewardClick,
}: {
  reward: DailyReward;
  activeDay: number | null;
  onRewardClick?: (day: number) => void;
}) => {
  const isActive = activeDay !== null && reward.day === activeDay;

  const isClaimed =
    !!reward.claimed ||
    reward.status === "CLAIMED" ||
    reward.status === "COMPLETED";

  const isAvailable = reward.status === "AVAILABLE";
  const isLocked = reward.status === "LOCKED";
  const disabled = !isAvailable;

  return (
    <div className="flex h-full flex-col items-center">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRewardClick?.(reward.day)}
        className={[
          "group relative w-full overflow-hidden rounded-2xl p-px",
          "transition-all duration-300",
          isActive
            ? "bg-linear-to-br from-cyan-300 via-orange-400 to-orange-600 shadow-[0_0_28px_rgba(34,211,238,0.25)]"
            : "bg-orange-500/50",
          disabled ? "cursor-not-allowed opacity-60" : "hover:scale-[1.03]",
        ].join(" ")}
        aria-label={`Claim reward for day ${reward.day}`}
      >
        <div className="relative min-h-37.5 rounded-2xl bg-linear-to-br from-[#3b2418] via-[#24120f] to-[#120908] p-3 sm:p-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,142,74,0.22),transparent_55%)]" />

          {(isClaimed || isLocked) && (
            <div className="absolute right-2 top-2 z-10 rounded-full bg-black/55 p-1.5 text-white/80">
              {isClaimed ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
            </div>
          )}

          <div className="relative flex justify-center">
            <span
              className={[
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                isClaimed
                  ? "bg-emerald-400/15 text-emerald-200"
                  : isLocked
                    ? "bg-white/10 text-white/60"
                    : "bg-cyan-300/15 text-cyan-200",
              ].join(" ")}
            >
              {isClaimed ? "Claimed" : isLocked ? "Locked" : "Available"}
            </span>
          </div>

          <div className="relative mt-3 flex aspect-square items-center justify-center rounded-2xl bg-white/95 shadow-inner">
            <div className="absolute inset-2 rounded-xl bg-linear-to-b from-orange-100 to-white" />

            <Image
              src={
                isLocked || isAvailable
                  ? "/img/gift/surprise-box.svg"
                  : "/img/coin.svg"
              }
              alt={isLocked ? "Locked reward" : "Coin reward"}
              width={46}
              height={46}
              className={[
                "relative drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]",
                isLocked ? "grayscale opacity-70" : "",
                isAvailable ? "animate-bob" : "",
              ].join(" ")}
            />
          </div>

          <div className="relative mt-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
              Reward
            </p>
            <p className="mt-0.5 text-lg font-extrabold text-cyan-200">
              {formatAmount(reward.amount)}
            </p>
          </div>
        </div>
      </button>

      <div
        className={[
          "mt-2 w-full rounded-full px-3 py-1.5 text-center text-xs sm:text-sm font-bold uppercase tracking-wider",
          isActive
            ? "bg-cyan-300 text-[#160d0a] shadow-[0_0_18px_rgba(34,211,238,0.25)]"
            : "bg-white/10 text-white/55",
        ].join(" ")}
      >
        Day {reward.day}
      </div>
    </div>
  );
};

export default RewardCard;
