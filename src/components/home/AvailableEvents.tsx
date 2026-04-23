"use client";

import { Accordion } from "@/components/ui/accordion";
import { useJoinEvent } from "@/hooks/events-complex/useEvents";
import { EventComplexItem } from "@/types/event";
import { Loader2, X } from "lucide-react";
import EventAccordionCard from "../complex-event/EventAccordionCard";

interface WeekEventsModalProps {
  open: boolean;
  onClose: () => void;
  events: EventComplexItem[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
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

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-end bg-black/35 p-6">
      <div className="relative w-full max-w-195 rounded-3xl border border-[#ff7a2f] bg-[#8F421E]/95 p-4 text-white shadow-[0_0_24px_rgba(255,107,47,0.25)] backdrop-blur-sm">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-white/90 transition hover:text-white"
          aria-label="Close modal"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="pr-10">
          <h2 className="text-[32px] font-extrabold uppercase tracking-wide text-cyan-300">
            {title}
          </h2>

          <p className="mt-2 max-w-170 font-helvetica text-sm leading-6 text-white/75">
            {subtitle}
          </p>
        </div>

        <div className="mt-5 max-h-105 overflow-y-auto pr-2 thin-scroll overscroll-contain">
          {isLoading ? (
            <div className="flex min-h-60 flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">
                Loading Events...
              </p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex min-h-60 items-center justify-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                No Events Available
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {events.map((event) => (
                <EventAccordionCard
                  key={event.id}
                  event={event}
                  isPending={isPending}
                  onJoin={(eventId) => joinEvent({ idEvent: eventId })}
                />
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailableEvents;