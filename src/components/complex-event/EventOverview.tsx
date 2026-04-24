import { CalendarDays, Target, Trophy } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/event.utils";
import { EventComplexItem } from "@/types/event";

type EventOverviewProps = {
  event: EventComplexItem;
};

export default function EventOverview({ event }: EventOverviewProps) {
  const currentValue = event.progress?.currentValue ?? 0;
  const rankingEnabled = event.rankingConfig?.enabled;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/15 p-4">
        <p className="text-sm leading-6 text-white/80">
          {event.description || "No event details available yet."}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            <CalendarDays className="h-4 w-4" />
            Duration
          </div>
          <p className="text-sm text-white">
            {formatDate(event.startDate)} - {formatDate(event.endDate)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            <Target className="h-4 w-4" />
            Progress
          </div>
          <p className="text-lg font-extrabold text-white">{currentValue}</p>
          <p className="mt-1 text-xs text-white/60">
            Last update: {formatDateTime(event.progress?.lastUpdate)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            <Trophy className="h-4 w-4" />
            Ranking
          </div>
          <p className="text-sm text-white">
            {rankingEnabled ? "Enabled" : "Disabled"}
          </p>
        </div>
      </div>
    </div>
  );
}
