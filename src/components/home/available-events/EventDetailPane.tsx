import CompetitiveRewardsList from "@/components/complex-event/CompetitiveRewardList";
import EventOverview from "@/components/complex-event/EventOverview";
import MilestonesList from "@/components/complex-event/MilestonesList";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/event.utils";
import { ArrowLeft, Clock3 } from "lucide-react";
import { EventDetailPaneProps } from "./types";

export default function EventDetailPane({
  event,
  isPending,
  onJoin,
  onBack,
}: EventDetailPaneProps) {
  const rankingEnabled = event.rankingConfig?.enabled;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 px-4 pt-3 pb-1 text-xs text-white/30 transition-colors hover:text-white/60 sm:hidden"
      >
        <ArrowLeft size={12} /> Back
      </button>

      <div className="space-y-5 overflow-y-auto px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest"
              style={{
                background: "rgba(124,248,255,0.08)",
                color: "#7cf8ff",
                border: "1px solid rgba(124,248,255,0.22)",
              }}
            >
              {event.type ?? "Event"}
            </span>

            <span
              className="rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest"
              style={{
                background: event.accepted
                  ? "rgba(52,211,153,0.12)"
                  : "rgba(255,255,255,0.05)",
                color: event.accepted ? "#a7f3d0" : "rgba(255,255,255,0.7)",
                border: event.accepted
                  ? "1px solid rgba(52,211,153,0.28)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {event.accepted ? "Joined" : "Available to Join"}
            </span>
          </div>

          <span className="flex items-center gap-1 text-[10px] font-mono text-white/25">
            <Clock3 size={10} />
            {formatDate(event.startDate)} - {formatDate(event.endDate)}
          </span>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-extrabold uppercase tracking-wide text-white sm:text-2xl">
            {event.name}
          </h3>

          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(124,248,255,0.3) 0%, rgba(255,122,47,0.16) 40%, transparent 100%)",
            }}
          />
        </div>

        <EventOverview event={event} />

        <MilestonesList milestones={event.milestones} eventId={event.id} />

        {rankingEnabled && (
          <CompetitiveRewardsList rewards={event.competitiveRewards} />
        )}

        <div className="flex justify-end border-t border-white/8 pt-1">
          <Button
            disabled={isPending || event.accepted}
            variant="secondary"
            onClick={() => onJoin(String(event.id))}
          >
            {event.accepted ? "Joined" : isPending ? "Joining..." : "Join Event"}
          </Button>
        </div>
      </div>
    </div>
  );
}
