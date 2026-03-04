"use client";

import { useSession } from "next-auth/react";
import {
  DailyLoginRewardsModal,
  type DailyReward,
} from "@/components/rewards/DailyLoginRewardsModal";
import { useDailyLoginRewardsGate } from "@/hooks/rewards/useDailyLoginRewardsGate";

const MOCK_REWARDS: DailyReward[] = Array.from({ length: 7 }).map((_, i) => ({
  day: i + 1,
  amount: 5000,
  claimed: i + 1 < 3,
}));

export default function DailyLoginRewardsGate() {
  const { data: session, status } = useSession();

  const userId =
    (session?.user as any)?.profile?.userId ?? (session?.user as any)?.id;

  const { open, setOpen } = useDailyLoginRewardsGate({
    userId,
    storageKeyPrefix: "oat:daily-login-rewards",
  });

  if (status === "loading") return null;

  return (
    <DailyLoginRewardsModal
      open={open}
      onOpenChange={setOpen}
      title="DAILY LOGIN REWARDS"
      subtitle="Rewards claimed!"
      rewards={MOCK_REWARDS}
      activeDay={3}
      onViewEvent={() => {
        setOpen(false);
      }}
    />
  );
}
