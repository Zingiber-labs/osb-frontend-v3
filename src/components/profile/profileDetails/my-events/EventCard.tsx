"use client";

import { Button } from "@/components/ui/button";
import { EventItem } from "@/types/event";
import clsx from "clsx";
import Image from "next/image";

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

const getRewardIcon = (code: string) => {
  const iconSrc = rewardIconMap[code];

  if (!iconSrc) return null;

  return (
    <Image
      src={iconSrc}
      alt={rewardLabelMap[code] ?? code}
      width={15}
      height={15}
      className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] animate-bob"
    />
  );
};

const getTimeLeftLabel = (endDate: string) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "ENDED";

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 1) return "ENDS IN 1 DAY";
  return `ENDS IN ${days} DAYS`;
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

const EventCard = ({ event }: { event: EventItem }) => {
  const currentValue = event.progress?.currentValue ?? 0;
  const totalSteps = event.steps.length;

  const completedSegments = event.steps.filter(
    (step) => currentValue >= step.conditionValue,
  ).length;

  const availableStep = event.steps.find((step) => step.status === "AVAILABLE");

  return (
    <div className="rounded-xl border border-cyan-400/20 bg-[#161d23] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold uppercase tracking-wide text-white">
            {event.name}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            {getDescription(event)}
          </p>
        </div>

        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
          {getTimeLeftLabel(event.endDate)}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-6">
        {event.steps.map((step) => (
          <div key={step.step} className="flex items-center gap-4">
            {step.rewards.map((reward, index) => (
              <div
                key={`${step.step}-${reward.code}-${index}`}
                className="flex items-center gap-2 text-white"
              >
                {getRewardIcon(reward.code)}
                <span className="text-lg font-medium">
                  {reward.amount} {rewardLabelMap[reward.code] ?? reward.code}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-1.5">
        {event.steps.map((step) => {
          const isCompleted = currentValue >= step.conditionValue;

          return (
            <div
              key={step.step}
              className={clsx(
                "h-2 flex-1 rounded-sm",
                isCompleted ? "bg-orange-500" : "bg-black/50",
              )}
            />
          );
        })}
      </div>

      <div className="rounded-lg bg-[#120f10] p-4">
        {availableStep ? (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-400">
                Congratulations!
              </p>
              <p className="mt-1 text-sm text-white/75">
                You completed this mission, you can now claim your reward.
              </p>
            </div>

            <Button className="min-w-[140px] rounded-full bg-cyan-400 px-8 font-semibold text-black hover:bg-cyan-300">
              CLAIM
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-white/80">
              Progress: {currentValue}
            </p>
            <p className="text-sm text-white/55">
              Completed milestones: {completedSegments} / {totalSteps}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;