"use client";

import * as React from "react";
import Image from "next/image";
import { X } from "lucide-react";

export type ClaimedRewardItem = {
  type: string;
  code?: string;
  amount: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  rewards: ClaimedRewardItem[];
  autoHideMs?: number;
};

const ANIMATION_MS = 320;

function formatRewardItem(item: ClaimedRewardItem): string {
  const amount = Number(item.amount ?? 0);

  if (item.type === "XP") {
    return `${amount} pts XP`;
  }

  if (item.type === "CURRENCY") {
    const label = (item.code ?? "COINS").toLowerCase();
    return `${amount} ${label}`;
  }

  const label = (item.code ?? item.type ?? "reward").toLowerCase();
  return `${amount} ${label}`;
}

function formatRewardsList(rewards: ClaimedRewardItem[]): string {
  if (!rewards?.length) return "your reward";
  return rewards.map(formatRewardItem).join(" + ");
}

export function RewardClaimedToast({
  open,
  onClose,
  rewards,
  autoHideMs = 5000,
}: Props) {
  const [mounted, setMounted] = React.useState(open);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    setVisible(false);
    const t = setTimeout(() => setMounted(false), ANIMATION_MS);
    return () => clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    if (!open || !autoHideMs) return;
    const t = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(t);
  }, [open, autoHideMs, onClose]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed z-[70] pointer-events-none",
        "inset-0 flex items-center justify-center",
        "sm:inset-auto sm:block sm:bottom-6 sm:right-6",
      ].join(" ")}
    >
      <div
        className={[
          "pointer-events-auto relative",
          "w-[400px] max-w-[calc(100vw-2rem)] h-[229px]",
          "rounded-2xl overflow-hidden",
          "bg-orange-dark border border-primary-orange",
          "shadow-[0_18px_40px_rgba(0,0,0,0.35)]",
          "transition-all ease-out duration-300",
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1 text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-full flex-col items-center justify-center px-6 py-4 text-center">
          <Image
            src="/img/misteryBox.png"
            alt="Mystery box"
            width={72}
            height={72}
            className="drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)]"
            priority
          />

          <h3 className="mt-2 text-xl font-semibold tracking-[0.12em] text-secondary-cyan">
            CONGRATULATIONS!
          </h3>

          <p className="mt-1 text-sm text-white/85">Reward claimed.</p>
          <p className="text-sm text-white/95">
            You received {formatRewardsList(rewards)}
          </p>
        </div>
      </div>
    </div>
  );
}
