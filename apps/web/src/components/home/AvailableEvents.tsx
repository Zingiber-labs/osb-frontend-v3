"use client";

import { useJoinEvent } from "@/hooks/events-complex/useEvents";
import EventDetailPane from "@/components/home/available-events/EventDetailPane";
import EmptyDetail from "@/components/home/available-events/EmptyDetail";
import EventListItem from "@/components/home/available-events/EventListItem";
import { AvailableEventsProps } from "@/components/home/available-events/types";
import { useSelectedEvent } from "@/components/home/available-events/useSelectedEvent";
import { CalendarDays, Loader2, X } from "lucide-react";

const DEFAULT_TITLE = "AVAILABLE EVENTS";
const DEFAULT_SUBTITLE =
  "In the Outer Sports Ballers galaxy, the competition never stops. In addition to our regular gameplay, we've designed limited-time Special Events to push your skills to the limit and reward the best players in the cosmos.";

const AvailableEvents = ({
  open,
  onClose,
  events,
  isLoading = false,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
}: AvailableEventsProps) => {
  const { mutate: joinEvent, isPending } = useJoinEvent();
  const { selectedEvent, setSelectedEvent } = useSelectedEvent({ open, events });

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