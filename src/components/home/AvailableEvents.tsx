"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { useJoinEvent } from "@/hooks/events-complex/useEvents";

export type EventItem = {
  id: number | string;
  name: string;
  date: string;
  description?: string;
  accepted?: boolean;
};

interface WeekEventsModalProps {
  open: boolean;
  onClose: () => void;
  events: EventItem[];
  title?: string;
  subtitle?: string;
}

const WeekEventsModal = ({
  open,
  onClose,
  events,
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
          <Accordion type="single" collapsible className="space-y-4">
            {events.map((event) => (
              <AccordionItem
                key={event.id}
                value={String(event.id)}
                className="overflow-hidden rounded-md border-0 bg-[#B45322]"
              >
                <AccordionTrigger className="px-4 py-4 [&>svg]:text-white/80">
                  <div className="flex w-full items-center justify-between pr-2 text-left">
                    <span className="text-[22px] font-extrabold uppercase tracking-wide text-white">
                      {event.name}
                    </span>

                    <span className="flex items-center gap-3 text-sm font-bold text-white/90">
                      {event.date}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="border-t border-white/10 px-4 pb-4 pt-3 text-sm leading-6 text-white/80">
                  {event.description || "No event details available yet."}
                  <div className="mt-5 flex justify-end gap-3">
                    <Button
                      disabled={isPending || event.accepted}
                      variant="secondary"
                      onClick={() => joinEvent({ idEvent: String(event.id) })}
                    >
                      {event.accepted
                        ? "Joined"
                        : isPending
                          ? "Joining..."
                          : "Join Event"}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default WeekEventsModal;
