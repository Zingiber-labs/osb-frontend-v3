import { useProfileStats } from "@/hooks/profile/useProfile";
import React from "react";

export type StatRow = {
  id: number;
  label: string;
  value: string | number;
};

const pad5 = (v: string | number) => String(v).padStart(5, "0");

function formatPct(v: unknown) {
  if (v === null || v === undefined) return "0.0%";
  const s = String(v);
  return s.includes("%") ? s : `${s}%`;
}

function buildStatRows(profile: any): StatRow[] {
  const s = profile ?? {};

  return [
    { id: 1, label: "Minutes", value: s.min ?? 0 },
    { id: 2, label: "Points", value: s.pts ?? 0 },
    { id: 3, label: "Rebounds", value: s.reb ?? 0 },
    { id: 4, label: "Defensive Rebounds", value: s.dreb ?? 0 },
    { id: 5, label: "Offensive Rebounds", value: s.oreb ?? 0 },
    { id: 6, label: "Assists", value: s.ast ?? 0 },
    { id: 7, label: "Steals", value: s.stl ?? 0 },
    { id: 8, label: "Blocks", value: s.blk ?? 0 },
    { id: 9, label: "Turnover", value: s.turnovers ?? 0 },

    { id: 10, label: "Field Goal", value: s.fgm ?? 0 },
    { id: 11, label: "FG %", value: formatPct(s.fg_pct) },

    { id: 12, label: "3 Pointers", value: s.fg3m ?? 0 },
    { id: 13, label: "3PT %", value: formatPct(s.fg3_pct) },

    { id: 14, label: "Free Throws", value: s.ftm ?? 0 },
    { id: 15, label: "FT %", value: formatPct(s.ft_pct) },

    { id: 16, label: "Personal Fouls", value: s.fouls ?? 0 },
  ];
}

function splitStats(rows: StatRow[]) {
  const ordered = [...rows].sort((a, b) => a.id - b.id);
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

const ProfileStats = ({ title = "Stats" }: ProfileStatsProps) => {
  const { data, isLoading, isError } = useProfileStats();

  const rows = React.useMemo(() => buildStatRows(data), [data]);
  const { left, right } = React.useMemo(() => splitStats(rows), [rows]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-primary/50 bg-black/10 p-4 text-sm">
        Loading stats...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-primary/50 bg-black/10 p-4 text-sm">
        Failed to load stats.
      </div>
    );
  }

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
