import React from "react";

export type StatRow = {
  id: number;
  label: string;
  value: string | number;
};

const pad5 = (v: string | number) => String(v).padStart(5, "0");

const stats: StatRow[] = [
  { id: 1, label: "Minutes", value: 240 },
  { id: 2, label: "Points", value: 1023 },
  { id: 3, label: "Rebounds", value: 430 },
  { id: 4, label: "Defensive Rebounds", value: 300 },
  { id: 5, label: "Offensive Rebounds", value: 130 },
  { id: 6, label: "Assists", value: 210 },
  { id: 7, label: "Steals", value: 55 },
  { id: 8, label: "Blocks", value: 44 },
  { id: 9, label: "Turnover", value: 60 },
  { id: 10, label: "Field Goal", value: 380 },
  { id: 11, label: "FG %", value: "48.5%" },
  { id: 12, label: "3 Pointers", value: 120 },
  { id: 13, label: "3PT %", value: "36.2%" },
  { id: 14, label: "Free Throws", value: 200 },
  { id: 15, label: "FT %", value: "82.1%" },
  { id: 16, label: "Personal Fouls", value: 95 },
];

function splitStats() {
  const ordered = [...stats].sort((a, b) => a.id - b.id);
  const mid = Math.ceil(ordered.length / 2);

  return {
    left: ordered.slice(0, mid),
    right: ordered.slice(mid),
  };
}

function StatBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/15 border border-primary/60 text-[11px] font-extrabold text-white">
      {n}
    </span>
  );
}

function StatCell({ row }: { row: StatRow }) {
  const isPct = row.label.includes("%");
  const display = isPct ? row.value : pad5(row.value);

  return (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <StatBadge n={row.id} />
        <span className="truncate text-sm uppercase tracking-widest font-semibold">
          {row.label}
        </span>
      </div>

      <div className="text-right sm:text-center text-sm font-semibold tracking-widest tabular-nums">
        {display}
      </div>
    </>
  );
}

interface ProfileStatsProps {
  title?: string;
}

const ProfileStats = ({ title }: ProfileStatsProps) => {
  const { left, right } = React.useMemo(() => splitStats(), []);

  return (
    <div className="overflow-hidden rounded-lg border border-primary/50 bg-black/10">
      {/* Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-orange-32/60 px-4 py-3 text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.25em] border-b border-white/15">
        <div>{title}</div>
        <div className="text-right sm:text-center">Cumulative Total</div>
        <div className="hidden sm:block">{title}</div>
        <div className="hidden sm:block text-center">Cumulative Total</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/15">
        {Array.from({ length: Math.max(left.length, right.length) }).map(
          (_, idx) => {
            const leftData = left[idx];
            const rightData = right[idx];

            return (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-4 gap-y-3 sm:gap-y-0 px-4 py-4 bg-primary/10 hover:bg-white/10 transition-colors"
              >
                {leftData ? (
                  <StatCell row={leftData} />
                ) : (
                  <>
                    <div />
                    <div />
                  </>
                )}
                {rightData ? (
                  <StatCell row={rightData} />
                ) : (
                  <>
                    <div />
                    <div />
                  </>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

export default ProfileStats;
