"use client";

import CompetitiveRewardsList from "@/components/complex-event/CompetitiveRewardList";
import EventOverview from "@/components/complex-event/EventOverview";
import MilestonesList from "@/components/complex-event/MilestonesList";
import { Button } from "@/components/ui/button";
import { useJoinEvent } from "@/hooks/events-complex/useEvents";
import { formatDate } from "@/lib/event.utils";
import { EventComplexItem } from "@/types/event";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface WeekEventsModalProps {
  open: boolean;
  onClose: () => void;
  events: EventComplexItem[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

function EventListItem({
  event,
  isSelected,
  onClick,
}: {
  event: EventComplexItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border-b border-white/5 px-3 py-3 text-left transition-all duration-150"
      style={{
        background: isSelected
          ? "linear-gradient(90deg, rgba(124,248,255,0.12) 0%, rgba(0,0,0,0) 100%)"
          : event.accepted
            ? "rgba(255,255,255,0.02)"
            : "transparent",
        borderLeft: isSelected
          ? "3px solid #7cf8ff"
          : event.accepted
            ? "3px solid rgba(255,122,47,0.28)"
            : "3px solid transparent",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`line-clamp-2 text-sm font-bold uppercase tracking-wide ${
              isSelected ? "text-white" : "text-white/82"
            }`}
          >
            {event.name}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            <span>{event.type ?? "Event"}</span>
            <span>•</span>
            <span>{formatDate(event.startDate)}</span>
          </div>
        </div>

        {event.accepted ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">
            <CheckCircle2 className="h-3 w-3" />
            Joined
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
            Open
          </span>
        )}
      </div>
    </button>
  );
}

function EmptyDetail() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: "rgba(255,107,47,0.07)",
          border: "1px solid rgba(255,122,47,0.15)",
          boxShadow: "0 0 28px rgba(255,107,47,0.07)",
        }}
      >
        <CalendarDays size={26} color="rgba(255,255,255,0.15)" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest leading-relaxed text-white/20">
        Select an event
      </p>
    </div>
  );
}

function EventDetailPane({
  event,
  isPending,
  onJoin,
  onBack,
}: {
  event: EventComplexItem;
  isPending: boolean;
  onJoin: (eventId: string) => void;
  onBack: () => void;
}) {
  const rankingEnabled = event.rankingConfig?.enabled;

  return (
    <div className="flex h-full w-full overflow-hidden">
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

const AvailableEvents = ({
  open,
  onClose,
  events,
  isLoading = false,
  title = "AVAILABLE EVENTS",
  subtitle = "In the Outer Sports Ballers galaxy, the competition never stops. In addition to our regular gameplay, we've designed limited-time Special Events to push your skills to the limit and reward the best players in the cosmos.",
}: WeekEventsModalProps) => {
  const { mutate: joinEvent, isPending } = useJoinEvent();
  const [selectedEvent, setSelectedEvent] = useState<EventComplexItem | null>(null);

  useEffect(() => {
    if (!selectedEvent) return;

    const freshEvent = events.find(
      (event) => String(event.id) === String(selectedEvent.id)
    );

    setSelectedEvent(freshEvent ?? null);
  }, [events, selectedEvent]);

  useEffect(() => {
    if (!open) {
      setSelectedEvent(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-stretch">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <aside
        className="relative z-10 flex h-full w-full flex-col text-white"
        style={{
          background: "linear-gradient(160deg, #180801 0%, #2a1006 45%, #3a1809 100%)",
          borderTop: "1px solid rgba(255,122,47,0.18)",
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="h-0.75 w-full shrink-0"
          style={{
            background: "linear-gradient(90deg, #FF6B2F 0%, #7cf8ff 50%, #FF6B2F 100%)",
            opacity: 0.75,
          }}
        />

        <header
          className="flex shrink-0 items-start justify-between gap-4 px-4 py-4 sm:px-5"
          style={{
            borderBottom: "1px solid rgba(255,122,47,0.18)",
            background: "linear-gradient(90deg, rgba(255,107,47,0.07) 0%, transparent 100%)",
          }}
        >
          <div className="flex w-full items-start gap-3">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "rgba(255,107,47,0.18)",
                border: "1px solid rgba(255,122,47,0.4)",
                boxShadow: "0 0 14px rgba(255,107,47,0.35)",
              }}
            >
              <CalendarDays size={16} color="#ff7a2f" />
            </div>

            <div className="w-full">
              <h2
                className="text-sm font-extrabold uppercase tracking-[0.18em] leading-none sm:text-base"
                style={{ color: "#7cf8ff" }}
              >
                {title}
              </h2>

              <p className="mt-2 max-w-4xl text-xs leading-5 text-white/45 sm:text-sm sm:leading-6">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/10 hover:text-white/70 active:scale-90"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
          <div
            className="h-full overflow-hidden border border-[rgba(255,122,47,0.16)]"
            style={{
              background: "linear-gradient(160deg, #1a0902 0%, #2d1107 50%, #381608 100%)",
              boxShadow: "inset 0 0 0 1px rgba(124,248,255,0.04)",
            }}
          >
            {isLoading ? (
              <div className="flex h-full min-h-full flex-col items-center justify-center gap-4 px-3 py-16 sm:px-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    background: "rgba(124,248,255,0.08)",
                    border: "1px solid rgba(124,248,255,0.2)",
                  }}
                >
                  <Loader2 className="h-7 w-7 animate-spin text-[#7cf8ff]" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40 sm:text-xs">
                  Loading Events...
                </p>
              </div>
            ) : events.length === 0 ? (
              <div className="flex h-full min-h-full flex-col items-center justify-center gap-4 px-3 py-16 text-center sm:px-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    background: "rgba(255,107,47,0.07)",
                    border: "1px solid rgba(255,122,47,0.15)",
                    boxShadow: "0 0 28px rgba(255,107,47,0.07)",
                  }}
                >
                  <CalendarDays size={26} color="rgba(255,255,255,0.15)" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest leading-relaxed text-white/20">
                  No events available
                </p>
              </div>
            ) : (
              <div className="flex h-full overflow-hidden">
                <div
                  className={`${selectedEvent ? "hidden sm:flex" : "flex"} flex-col overflow-hidden sm:w-65 sm:shrink-0`}
                  style={{
                    borderRight: "1px solid rgba(255,122,47,0.14)",
                  }}
                >
                  <div
                    className="flex-1 overflow-y-auto overflow-x-hidden"
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(255,122,47,0.2) transparent",
                    }}
                  >
                    {events.map((event) => (
                    <EventListItem
                        key={event.id}
                        event={event}
                        isSelected={selectedEvent?.id === event.id}
                        onClick={() => setSelectedEvent(event)}
                      />
                    ))}
                  </div>
                </div>

                <div
                  className={`${selectedEvent ? "flex" : "hidden sm:flex"} min-w-0 flex-1 overflow-hidden`}
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(26,9,2,0.92) 0%, rgba(45,17,7,0.96) 50%, rgba(56,22,8,0.98) 100%)",
                    borderLeft: "1px solid rgba(255,122,47,0.14)",
                  }}
                >
                  {selectedEvent ? (
                    <EventDetailPane
                      event={selectedEvent}
                      isPending={isPending}
                      onJoin={(eventId) => joinEvent({ idEvent: eventId })}
                      onBack={() => setSelectedEvent(null)}
                    />
                  ) : (
                    <EmptyDetail />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="h-0.75 shrink-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,107,47,0.6) 0%, rgba(124,248,255,0.35) 50%, rgba(255,107,47,0.6) 100%)",
          }}
        />
      </aside>
    </div>
  );
};

export default AvailableEvents;