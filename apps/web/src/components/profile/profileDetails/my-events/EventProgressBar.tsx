"use client";

import clsx from "clsx";
import { EventItem } from "@/types/event";

type EventProgressBarProps = {
  currentValue: number;
  steps: EventItem["steps"];
  barClassName?: string;
};

export default function EventProgressBar({
  currentValue,
  steps,
  barClassName,
}: EventProgressBarProps) {
  if (!steps?.length) return null;

  return (
    <div className={clsx("flex w-full gap-1.5", barClassName)}>
      {steps.map((step) => {
        const isCompleted = currentValue >= step.conditionValue;

        return (
          <div
            key={step.step}
            className={clsx(
              "h-3 flex-1 rounded-sm transition-colors",
              isCompleted ? "bg-primary" : "bg-black/70",
            )}
          />
        );
      })}
    </div>
  );
}
