"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

import {
  DailyLoginRewardsModal,
  type DailyReward,
} from "@/components/rewards/DailyLoginRewardsModal";

import { useDailyLoginRewardsGate } from "@/hooks/rewards/useDailyLoginRewardsGate";
import { useEventsForRewards } from "@/hooks/rewards/useRewards";

type EventReward = {
  type: "CURRENCY" | string;
  code?: string;
  amount: number;
};

type EventStep = {
  step: number;
  conditionValue?: number;
  status: "AVAILABLE" | "CLAIMED" | "LOCKED" | "COMPLETED" | string;
  rewards: EventReward[];
};

type EventsResponseItem = {
  id: string;
  uid: string;
  name: string;
  type: "DAILY_LOGIN" | string;
  startDate: string;
  endDate: string;
  progress?: {
    currentValue?: number;
    lastUpdate?: string;
  };
  steps: EventStep[];
};

function mapStepsToDailyRewards(steps: EventStep[]): DailyReward[] {
  return (steps ?? [])
    .slice()
    .sort((a, b) => a.step - b.step)
    .map((s) => {
      const currencyReward = (s.rewards ?? []).find(
        (r) => r.type === "CURRENCY",
      );
      const amount = Number(currencyReward?.amount ?? 0);

      const claimed = s.status === "CLAIMED" || s.status === "COMPLETED";

      return {
        day: s.step,
        amount,
        claimed,
      };
    });
}

function getActiveDayFromSteps(steps: EventStep[]): number {
  const firstAvailable = (steps ?? [])
    .slice()
    .sort((a, b) => a.step - b.step)
    .find((s) => s.status === "AVAILABLE");

  if (firstAvailable) return firstAvailable.step;

  const firstNotClaimed = (steps ?? [])
    .slice()
    .sort((a, b) => a.step - b.step)
    .find((s) => s.status !== "CLAIMED" && s.status !== "COMPLETED");

  if (firstNotClaimed) return firstNotClaimed.step;

  return 1;
}

export default function DailyLoginRewardsGate() {
  const { data: session, status } = useSession();

  const userId =
    (session?.user as any)?.profile?.userId ?? (session?.user as any)?.id;

  const { open, setOpen } = useDailyLoginRewardsGate({
    userId,
    storageKeyPrefix: "oat:daily-login-rewards",
  });

  const { data: eventsData, isLoading, isError } = useEventsForRewards();

  const dailyLoginEvent = useMemo(() => {
    const list = (eventsData ?? []) as EventsResponseItem[];
    return list.find((e) => e.type === "DAILY_LOGIN");
  }, [eventsData]);

  const rewards = useMemo(() => {
    return mapStepsToDailyRewards(dailyLoginEvent?.steps ?? []);
  }, [dailyLoginEvent]);

  const activeDay = useMemo(() => {
    return getActiveDayFromSteps(dailyLoginEvent?.steps ?? []);
  }, [dailyLoginEvent]);
  if (status === "loading") return null;
  if (!open) return null;
  if (isLoading) return null;

  if (isError || !dailyLoginEvent) return null;

  return (
    <DailyLoginRewardsModal
      open={open}
      onOpenChange={setOpen}
      title={dailyLoginEvent.name?.toUpperCase() || "DAILY LOGIN REWARDS"}
      subtitle="Rewards claimed!"
      rewards={rewards}
      activeDay={activeDay}
      onViewEvent={() => {
        setOpen(false);
      }}
    />
  );
}
