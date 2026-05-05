import { EventComplexItem } from "@/types/event";
import { useEffect, useState } from "react";

type UseSelectedEventArgs = {
  open: boolean;
  events: EventComplexItem[];
};

export function useSelectedEvent({
  open,
  events,
}: UseSelectedEventArgs) {
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

  return { selectedEvent, setSelectedEvent };
}
