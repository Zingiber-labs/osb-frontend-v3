"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  DailyLoginRewardsModal,
  type DailyReward,
} from "@/components/rewards/DailyLoginRewardsModal";

import { useDailyLoginRewardsGate } from "@/hooks/rewards/useDailyLoginRewardsGate";
import { useClaimReward, useEventsForRewards } from "@/hooks/rewards/useRewards";

type EventReward = { type: "CURRENCY" | string; code?: string; amount: number };

type EventStep = {
  step: number;
  status: "AVAILABLE" | "CLAIMED" | "LOCKED" | "COMPLETED" | string;
  rewards: EventReward[];
};

type EventsResponseItem = {
  id: string;
  uid: string;
  name: string;
  type: "DAILY_LOGIN" | string;
  steps: EventStep[];
};

function mapStepsToDailyRewards(steps: EventStep[]): DailyReward[] {
  return (steps ?? [])
    .slice()
    .sort((a, b) => a.step - b.step)
    .map((s) => {
      const currencyReward = (s.rewards ?? []).find((r) => r.type === "CURRENCY");
      const amount = Number(currencyReward?.amount ?? 0);

      const claimed = s.status === "CLAIMED" || s.status === "COMPLETED";

      return {
        day: s.step,
        amount,
        claimed,
        status: s.status,
      };
    });
}

function getActiveDayFromSteps(steps: EventStep[]): number {
  const firstAvailable = (steps ?? [])
    .slice()
    .sort((a, b) => a.step - b.step)
    .find((s) => s.status === "AVAILABLE");

  return firstAvailable?.step ?? 1;
}

export default function DailyLoginRewardsGate() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const userId =
    (session?.user as any)?.profile?.userId ?? (session?.user as any)?.id;

  const { open, setOpen } = useDailyLoginRewardsGate({
    userId,
    storageKeyPrefix: "oat:daily-login-rewards",
  });

  const { data: eventsData, isLoading, isError } = useEventsForRewards();
  const claimMutation = useClaimReward();

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

  const subtitle = useMemo(() => {
    const hasAvailable = (dailyLoginEvent?.steps ?? []).some((s) => s.status === "AVAILABLE");
    return hasAvailable ? "Tap a reward to claim it!" : "Rewards claimed!";
  }, [dailyLoginEvent]);

  const handleRewardClick = async (day: number) => {
    if (!dailyLoginEvent) return;

    const stepObj = (dailyLoginEvent.steps ?? []).find((s) => s.step === day);
    if (!stepObj) return;

    if (stepObj.status !== "AVAILABLE") return;

    try {
      await claimMutation.mutateAsync({ eventId: dailyLoginEvent.id, step: day });
      toast.success("Reward claimed!");
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not claim reward.");
    }
  };

  if (status === "loading") return null;
  if (!open) return null;
  if (isLoading) return null;
  if (isError || !dailyLoginEvent) return null;

  return (
    <DailyLoginRewardsModal
      open={open}
      onOpenChange={setOpen}
      title={dailyLoginEvent.name?.toUpperCase() || "DAILY LOGIN REWARDS"}
      subtitle={subtitle}
      rewards={rewards}
      activeDay={activeDay}
      onRewardClick={handleRewardClick}
      onViewEvent={() => setOpen(false)}
    />
  );
}