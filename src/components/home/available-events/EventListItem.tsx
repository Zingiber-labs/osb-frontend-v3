import { formatDate } from "@/lib/event.utils";
import { CheckCircle2 } from "lucide-react";
import { EventListItemProps } from "./types";

export default function EventListItem({
  event,
  isSelected,
  onClick,
}: EventListItemProps) {
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
