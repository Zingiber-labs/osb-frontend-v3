"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  DailyLoginRewardsModal,
  type DailyReward,
} from "@/components/rewards/DailyLoginRewardsModal";

import {
  useClaimReward,
  useEventsForDailyLogin,
} from "@/hooks/events-daily-login/useDailyLoginEvent";
import { useDailyLoginRewardsGate } from "@/hooks/rewards/useDailyLoginRewardsGate";

type EventReward = { type: "CURRENCY" | string; code?: string; amount: number };

type EventStep = {
  step: number;
  status: "AVAILABLE" | "CLAIMED" | "LOCKED" | "COMPLETED" | string;
  rewards: EventReward[];
  conditionValue: number;
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
      const currencyReward = (s.rewards ?? []).find(
        (r) => r.type === "CURRENCY",
      );
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

function getSubtitle(steps: EventStep[]) {
  const hasAvailable = (steps ?? []).some(
    (step) => step.status === "AVAILABLE",
  );
  return hasAvailable ? "Tap a reward to claim it!" : "Rewards claimed!";
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

  const events = useMemo<EventsResponseItem[]>(() => {
    if (!eventsData) return [];
    return Array.isArray(eventsData) ? eventsData : [];
  }, [eventsData]);

  useEffect(() => {
    if (open) {
      setCurrentEventIndex(0);
    }
  }, [open]);

  const currentEvent = events[currentEventIndex];

  const rewards = useMemo(() => {
    if (!currentEvent) return [];
    return mapStepsToDailyRewards(currentEvent.steps ?? []);
  }, [currentEvent]);

  const activeDay = useMemo(() => {
    if (!currentEvent) return null;
    return getActiveDayFromSteps(currentEvent.steps ?? []);
  }, [currentEvent]);

  const subtitle = useMemo(() => {
    if (!currentEvent) return "";
    return getSubtitle(currentEvent.steps ?? []);
  }, [currentEvent]);

  const handleRewardClick = async (day: number) => {
    if (!currentEvent) return;

    const stepObj = (currentEvent.steps ?? []).find(
      (step: EventStep) => step.step === day,
    );
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

  const handleNextOrClose = () => {
    const isLastEvent = currentEventIndex >= events.length - 1;

    if (isLastEvent) {
      setOpen(false);
      return;
    }

    setCurrentEventIndex((prev) => prev + 1);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleNextOrClose();
      return;
    }

    setOpen(true);
  };

  if (status === "loading") return null;
  if (!open) return null;
  if (isLoading) return null;
  if (isError || events.length === 0 || !currentEvent) return null;

  return (
    <DailyLoginRewardsModal
      key={currentEvent.id}
      open={open}
      onOpenChange={handleOpenChange}
      title={currentEvent.name?.toUpperCase() || "DAILY LOGIN REWARDS"}
      subtitle={subtitle}
      rewards={rewards}
      activeDay={activeDay}
      onRewardClick={handleRewardClick}
      onViewEvent={handleNextOrClose}
    />
  );
}
