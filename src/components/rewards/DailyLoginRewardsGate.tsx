"use client";

import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  DailyLoginRewardsModal,
  type DailyReward,
} from "@/components/rewards/DailyLoginRewardsModal";

import { useDailyLoginRewardsGate } from "@/hooks/rewards/useDailyLoginRewardsGate";
import { useClaimReward, useEventsForDailyLogin, useEventsForRewards } from "@/hooks/rewards/useRewards";
import { Step } from "@/types/event";

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

function getActiveDayFromSteps(steps: EventStep[]): number | null {
  const firstAvailable = (steps ?? [])
    .slice()
    .sort((a, b) => a.step - b.step)
    .find((s) => s.status === "AVAILABLE");

  return firstAvailable?.step ?? null;
}

export default function DailyLoginRewardsGate() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  const userId =
    (session?.user as any)?.profile?.userId ?? (session?.user as any)?.id;

  const { open, setOpen } = useDailyLoginRewardsGate({
    userId,
    storageKeyPrefix: "oat:daily-login-rewards",
  });

  const { data: eventsData, isLoading, isError } = useEventsForDailyLogin();
  const claimMutation = useClaimReward();

  const eventsArray: EventsResponseItem[] = useMemo(() => {
    if (!eventsData) return [];
    return Array.isArray(eventsData) ? eventsData : [eventsData];
  }, [eventsData]);

  const currentEvent = eventsArray[currentEventIndex];

  const handleClose = () => {
    if (currentEventIndex < eventsArray.length - 1) {
      setCurrentEventIndex((prev) => prev + 1);
    } else {
      setOpen(false);
      setTimeout(() => setCurrentEventIndex(0), 300);
    }
  };

  const rewards = useMemo(() => {
    return mapStepsToDailyRewards(currentEvent?.steps ?? []);
  }, [currentEvent]);

  const activeDay = useMemo(() => {
    return getActiveDayFromSteps(currentEvent?.steps ?? []);
  }, [currentEvent]);

  const subtitle = useMemo(() => {
    const hasAvailable = (currentEvent?.steps ?? []).some((step: any) => step.status === "AVAILABLE");
    return hasAvailable ? "Tap a reward to claim it!" : "Rewards claimed!";
  }, [currentEvent]);

  const handleRewardClick = async (day: number) => {
    if (!currentEvent) return;

    const stepObj = (currentEvent.steps ?? []).find((s: any) => s.step === day);
    if (!stepObj) return;

    if (stepObj.status !== "AVAILABLE") return;

    try {
      await claimMutation.mutateAsync({ eventId: currentEvent.id, step: day });
      toast.success("Reward claimed!");
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not claim reward.");
    }
  };

  if (status === "loading") return null;
  if (!open) return null;
  if (isLoading) return null;
  if (isError || eventsArray.length === 0) return null;
  if (!currentEvent) return null;

  return (
    <DailyLoginRewardsModal
      open={open}
      onOpenChange={(val) => {
        if (!val) handleClose();
        else setOpen(true);
      }}
      title={currentEvent.name?.toUpperCase() || "DAILY LOGIN REWARDS"}
      subtitle={subtitle}
      rewards={rewards}
      activeDay={activeDay}
      onRewardClick={handleRewardClick}
      onViewEvent={handleClose}
      currentEventIndex={currentEventIndex}
      totalEvents={eventsArray.length}
    />
  );
}