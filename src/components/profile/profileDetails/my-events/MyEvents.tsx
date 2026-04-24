"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyEvents } from "@/hooks/events-complex/useEvents";
import { EventItem } from "@/types/event";
import { useMemo, useState } from "react";
import EventCard from "./EventCard";

const formatEventType = (type: string) => {
  return type.replaceAll("_", " ");
};

const MyEvents = () => {
  const { data: myEvents, isLoading, isError } = useMyEvents();
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const typedEvents = (myEvents ?? []) as EventItem[];

  const eventTypes = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(typedEvents.map((event) => event.type)),
    );
    return ["ALL", ...uniqueTypes];
  }, [typedEvents]);

  const filteredEvents = useMemo(() => {
    if (selectedType === "ALL") return typedEvents;
    return typedEvents.filter((event) => event.type === selectedType);
  }, [typedEvents, selectedType]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary/40 bg-[#1a2229] p-6 text-white">
        Loading events...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-white">
        Failed to load events.
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-orange-500/30 bg-[#8d3f16] p-4 md:p-6">
      <div className="mb-5">
        <Select
          value={selectedType ?? "ALL"}
          onValueChange={(value) => setSelectedType(value)}
        >
          <SelectTrigger className="w-75 text-white bg-[#12181d] cursor-pointer">
            <SelectValue className="text-white" placeholder="Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "ALL" ? "Active events" : formatEventType(type)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-4">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {!filteredEvents.length && (
        <div className="rounded-xl border border-white/10 bg-[#161d23] p-6 text-center text-white/70">
          No events found.
        </div>
      )}
    </section>
  );
};

export default MyEvents;
