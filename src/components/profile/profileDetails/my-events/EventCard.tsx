"use client";

import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { EventItem } from "@/types/event";
import EventDetailModal from "./EventDetailModal";
import EventProgressBar from "./EventProgressBar";

const getTimeLeftLabel = (endDate: string) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "ENDED";

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 1) return "IT ENDS IN 1 DAY";
  return `IT ENDS IN ${days} DAYS`;
};

const getSectionTitle = (type: string) => {
  if (type === "DAILY_LOGIN") return "DAILY LOGIN";
  return "EVENTS";
};

type EventCardProps = {
  event: EventItem;
};

export default function EventCard({ event }: EventCardProps) {
  const [open, setOpen] = useState(false);

  const currentValue = event.progress?.currentValue ?? 0;

  const completedSegments = useMemo(() => {
    return event.steps.filter((step) => currentValue >= step.conditionValue)
      .length;
  }, [currentValue, event.steps]);

  console.log("EventCard render", { event, currentValue, completedSegments })

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group w-full rounded-md border border-[#8f3f14] bg-[#6f2d0b] p-2 text-left transition hover:border-[#ff6a1a] hover:bg-[#7c3310]"
      >
        <div className="rounded-md bg-[linear-gradient(90deg,#1d2329_0%,#12181d_100%)] p-3 md:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400 md:text-xs">
                {getSectionTitle(event.type)}
              </p>

              <h3 className="truncate text-lg font-medium uppercase tracking-wide text-white md:text-2xl">
                {event.name}
              </h3>
            </div>

            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#c76833] md:text-[11px]">
              {getTimeLeftLabel(event.endDate)}
            </span>
          </div>

          <div className="space-y-2">
            <EventProgressBar currentValue={currentValue} steps={event.steps} />

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-white/55 md:text-xs">
                {completedSegments} / {event.steps.length}
              </p>

              <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/45 group-hover:text-white/70 md:text-xs">
                <Eye className="h-3.5 w-3.5" />
                <span>View detail</span>
              </div>
            </div>
          </div>
        </div>
      </button>

      <EventDetailModal event={event} open={open} onOpenChange={setOpen} />
    </>
  );
}