"use client";

import EventOverview from "@/components/complex-event/EventOverview";
import MilestonesList from "@/components/complex-event/MilestonesList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClaimReward } from "@/hooks/events-daily-login/useDailyLoginEvent";
import { EventItem } from "@/types/event";
import Image from "next/image";
import EventProgressBar from "./EventProgressBar";

type EventDetailModalProps = {
  event: EventItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const rewardLabelMap: Record<string, string> = {
  COINS: "Coins",
  GEMS: "Gems",
  XP: "XP",
};

const rewardIconMap: Record<string, string> = {
  COINS: "/img/coin.svg",
  GEMS: "/img/gem.svg",
  XP: "/img/xp.svg",
};

const getRewardIcon = (code?: string) => {
  if (!code) return null;

  const iconSrc = rewardIconMap[code];
  if (!iconSrc) return null;

  return (
    <Image
      src={iconSrc}
      alt={rewardLabelMap[code] ?? code}
      width={16}
      height={16}
      className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
    />
  );
};

const getTimeLeftLabel = (endDate: string) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "ENDED";

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 1) return "IT ENDS IN 1 DAY";
  return `IT ENDS IN ${days} DAYS`;
};

const getDescription = (event: EventItem) => {
  if (event.type === "DAILY_LOGIN") {
    return "Log in during the event period and complete the required daily progress to unlock rewards.";
  }

  if (event.type === "BOXSCORE") {
    return "Complete the event objective before the time runs out and claim the available rewards for each milestone.";
  }

  return "Complete the event objectives and collect the rewards available for each step.";
};

const getSectionTitle = (type: string) => {
  if (type === "DAILY_LOGIN") return "DAILY LOGIN";
  return "EVENTS";
};

const formatDate = (date?: string) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function EventDetailModal({
  event,
  open,
  onOpenChange,
}: EventDetailModalProps) {
  const { mutate: claimReward, isPending } = useClaimReward();
  const currentValue = event?.progress?.currentValue ?? 0;
  const completedSegments = event?.steps.filter(
    (step) => currentValue >= step.conditionValue,
  ).length;

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] min-w-[55vw] w-full max-w-3xl flex-col thin-scroll border border-[#ff6a1a]/30 bg-[#161d23] p-0 text-white">
        <DialogHeader className="shrink-0 border-b border-white/10 px-6 py-4">
          <DialogTitle className="text-2xl font-semibold uppercase tracking-wide">
            {event.name}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {event.type === "MILESTONE" ? (
              <div className="space-y-4">
                <EventOverview event={event} />

                <MilestonesList milestones={event.steps} eventId={event.id} />

                {/* {event.rankingConfig?.enabled && (
                  <CompetitiveRewardsList
                    rewards={event.competitiveRewards}
                  />
                )} */}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
                      {getSectionTitle(event.type)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {getDescription(event)}
                    </p>
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff6a1a]">
                    {getTimeLeftLabel(event.endDate)}
                  </span>
                </div>

                <EventOverview event={event} />

                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
                    Progress
                  </p>

                  <EventProgressBar
                    currentValue={currentValue}
                    steps={event.steps}
                  />

                  <p className="text-sm text-white/60">
                    Current value: {currentValue}
                  </p>
                </div>

                {/* Rewards by step */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
                    Rewards by step
                  </p>

                  <div className="space-y-4">
                    {event.steps.map((step) => {
                      const isAvailable = step.status === "AVAILABLE";
                      const isClaimed = step.status === "CLAIMED";

                      return (
                        <div
                          key={step.step}
                          className="rounded-xl border border-white/10 bg-black/20 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-cyan-400">
                              Step {step.step}
                            </p>

                            <span className="text-xs uppercase tracking-[0.16em] text-white/50">
                              {step.status}
                            </span>
                          </div>

                          <div className="mb-4 flex flex-wrap gap-4">
                            {step.rewards.map((reward, index) => (
                              <div
                                key={`${step.step}-${reward.code}-${index}`}
                                className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"
                              >
                                {getRewardIcon(reward.code)}

                                <span className="text-sm">
                                  {reward.amount}{" "}
                                  {rewardLabelMap[reward.code] ?? reward.code}
                                </span>
                              </div>
                            ))}
                          </div>

                          {isAvailable && (
                            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-5 py-4">
                              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-400">
                                    Congratulations!
                                  </p>

                                  <p className="mt-1 text-sm text-white/75">
                                    You completed this mission, you can now
                                    claim your reward.
                                  </p>
                                </div>

                                <Button
                                  className="h-11 rounded-full bg-cyan-400 px-8 font-semibold text-black hover:bg-cyan-300"
                                  onClick={() =>
                                    claimReward({
                                      eventId: event.id,
                                      step: step.step,
                                    })
                                  }
                                  disabled={isPending}
                                >
                                  {isPending ? "CLAIMING..." : "CLAIM"}
                                </Button>
                              </div>
                            </div>
                          )}

                          {isClaimed && (
                            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4">
                              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-green-400">
                                Reward already claimed
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
