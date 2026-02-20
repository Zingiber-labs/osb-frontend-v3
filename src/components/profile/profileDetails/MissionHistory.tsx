"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

const rankedHistory = [
  { label: "Jan", mp: 1350 },
  { label: "Feb", mp: 1280 },
  { label: "Mar", mp: 1420 },
  { label: "Apr", mp: 1505 },
  { label: "May", mp: 1470 },
  { label: "Jun", mp: 1550 },
  { label: "Jul", mp: 1535 },
  { label: "Aug", mp: 1650 },
  { label: "Sep", mp: 1780 },
  { label: "Oct", mp: 1855 },
  { label: "Nov", mp: 1805 },
  { label: "Dec", mp: 1890 },
];

const last20Missions = [
  { grade: "S", value: 16 },
  { grade: "A", value: 4 },
  { grade: "B", value: 14 },
  { grade: "C", value: 8 },
  { grade: "A", value: 10 },
  { grade: "B", value: 12 },
  { grade: "C", value: 9 },
  { grade: "Fail", value: 2 },
];

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-white/10 bg-black/80 px-3 py-2 text-xs text-white shadow-lg">
      <div className="mb-1 text-white/70">{label}</div>
      {payload.map((p, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ background: p.color }}
          />
          <span className="text-white/80">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function MissionHistory() {
  return (
    <div
      className={[
        "rounded-2xl border border-secondary-cyan/30",
        "bg-[#24282B]",
        "p-6 shadow-[0_0_14px_rgba(45,255,254,0.25)]",
      ].join(" ")}
    >
      <h2 className="text-xl font-bold tracking-wide text-white">
        MISSION HISTORY
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT: Line chart */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 text-lg font-semibold text-white/90">
            MP History Ranked
          </div>

          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rankedHistory} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 6" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                />
                <YAxis
                  domain={[1200, 2000]}
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                />
                <Tooltip content={<DarkTooltip />} />
                {/* “neon orange” vibe */}
                <Line
                  type="monotone"
                  dataKey="mp"
                  name="MP"
                  stroke="#ff8a2a"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 4 }}
                  style={{
                    filter:
                      "drop-shadow(0 0 6px rgba(255,138,42,0.65)) drop-shadow(0 0 14px rgba(255,138,42,0.35))",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: Bar chart */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 text-lg font-semibold text-white/90">
            Last 20 Missions
          </div>

          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last20Missions} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 6" />
                <XAxis
                  dataKey="grade"
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                />
                <YAxis
                  domain={[0, 20]}
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                />
                <Tooltip content={<DarkTooltip />} />

                <Bar
                  dataKey="value"
                  name="Missions"
                  radius={[6, 6, 2, 2]}
                  isAnimationActive
                  fill="#22d3ee"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
            <span className="rounded-md bg-white/5 px-2 py-1">S/A = orange</span>
            <span className="rounded-md bg-white/5 px-2 py-1">B/C = cyan</span>
            <span className="rounded-md bg-white/5 px-2 py-1">Fail = red</span>
            <span className="ml-auto text-white/40">
              (ejemplo con data mock)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
