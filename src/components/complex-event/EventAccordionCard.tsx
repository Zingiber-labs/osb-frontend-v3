import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import EventOverview from "./EventOverview";
import MilestonesList from "./MilestonesList";
import { EventComplexItem } from "@/types/event";
import { formatDate } from "@/lib/event.utils";
import CompetitiveRewardsList from "./CompetitiveRewardList";

type EventAccordionCardProps = {
  event: EventComplexItem;
  isPending: boolean;
  onJoin: (eventId: string) => void;
};

export default function EventAccordionCard({
  event,
  isPending,
  onJoin,
}: EventAccordionCardProps) {
  const rankingEnabled = event.rankingConfig?.enabled;

  return (
    <AccordionItem
      value={String(event.id)}
      className="overflow-hidden rounded-xl border border-white/10 bg-[#B45322]"
    >
      <AccordionTrigger className="px-4 py-4 hover:no-underline [&>svg]:text-white/80">
        <div className="flex w-full items-center justify-between gap-4 pr-2 text-left">
          <div>
            <span className="block text-[22px] font-extrabold uppercase tracking-wide text-white">
              {event.name}
            </span>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/60">
              <span>{event.type ?? "Event"}</span>
              <span>•</span>
              <span>{formatDate(event.startDate)}</span>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-white/10 bg-black/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/90">
            {event.accepted ? "Joined" : "Available to Join"}
          </span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="border-t border-white/10 px-4 pb-4 pt-4 text-sm text-white/85">
        <div className="space-y-4">
          <EventOverview event={event} />

          <MilestonesList milestones={event.milestones} eventId={event.id} />

          {rankingEnabled && (
            <CompetitiveRewardsList rewards={event.competitiveRewards} />
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button
              disabled={isPending || event.accepted}
              variant="secondary"
              onClick={() => onJoin(String(event.id))}
            >
              {event.accepted
                ? "Joined"
                : isPending
                  ? "Joining..."
                  : "Join Event"}
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
