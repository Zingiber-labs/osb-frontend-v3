import { CalendarDays } from "lucide-react";

export default function EmptyDetail() {
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
