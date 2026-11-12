"use client";

import { Image } from "lucide-react";
import React, { useState } from "react";

const STAT_COLUMNS = [
  "MIN",
  "PTS",
  "OREB",
  "DREB",
  "REB",
  "AST",
  "STL",
  "BLK",
  "TO",
  "FG",
  "FG%",
  "3PT",
  "3PT%",
  "FT",
  "FT%",
  "PF",
  "+/-",
] as const;

type StatKey = (typeof STAT_COLUMNS)[number];

export type PlayerRow = {
  name: string;
  dnpReason?: string;
  stats?: Partial<Record<StatKey, string | number>>;
};

export type Section = {
  label: string;
  players: PlayerRow[];
};

export type TeamBoxScore = {
  teamName: string;
  sections: Section[];
};

type BoxScoreCardProps = {
  teams: TeamBoxScore[];
  initialTeamIndex?: number;
};

const GRID_TEMPLATE = "220px repeat(17, minmax(2.5rem, 1fr))";

export const BoxScoreCard = ({
  teams,
  initialTeamIndex = 0,
}: BoxScoreCardProps) => {
  const [activeIndex, setActiveIndex] = useState(initialTeamIndex);
  const activeTeam = teams[activeIndex];

  return (
    <section
      className="
        w-full
        rounded-4xl
        shadow-2xl
        text-slate-100
        overflow-x-auto
        custom-scroll-thin
      "
    >
      <header className="flex w-full">
        {teams.map((team, idx) => {
          const isActive = idx === activeIndex;
          const isFirst = idx === 0;
          const isLast = idx === teams.length - 1;

          return (
            <button
              key={team.teamName}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={[
                "flex gap-4 items-center cursor-pointer flex-1 px-6 py-4 transition-colors",
                isActive
                  ? "bg-[#983012] text-slate-100"
                  : "bg-black/40 text-slate-300 hover:bg-black/60",
                isFirst ? "rounded-tl-[36px]" : "",
                isLast ? "rounded-tr-[36px]" : "",
              ].join(" ")}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/10">
                <Image className="h-4 w-4 text-slate-200" />
              </div>
              <h2 className="text-2xl font-extrabold uppercase tracking-[0.25em]">
                {team.teamName}
              </h2>
            </button>
          );
        })}
      </header>

      <div className="relative bg-[url('/figure-hero.svg')] bg-cover bg-center w-full">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative px-6 pb-6 space-y-6 w-full">
          {activeTeam.sections.map((section) => (
            <div key={section.label} className="space-y-3">
              {/* Subheader STARTERS / BENCH */}
              <div className="bg-[#a7461a]/80 -mx-6 px-6 py-2">
                <div
                  className="grid items-center text-[9px] uppercase tracking-[0.25em] text-slate-200/80"
                  style={{ gridTemplateColumns: GRID_TEMPLATE }}
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
                    {section.label}
                  </span>
                  {STAT_COLUMNS.map((col) => (
                    <span key={col} className="text-center whitespace-nowrap">
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Players */}
              <div className="space-y-1">
                {section.players.map((player, index) => (
                  <div
                    key={player.name + index + (player.dnpReason ?? "")}
                    className="border-t border-white/5 py-2"
                  >
                    <div
                      className="grid items-center text-[11px] tabular-nums"
                      style={{ gridTemplateColumns: GRID_TEMPLATE }}
                    >
                      <div className="text-sm font-semibold uppercase tracking-[0.25em]">
                        {player.name}
                      </div>

                      {player.dnpReason ? (
                        <div
                          className="text-xs tracking-[0.25em] uppercase text-slate-100 text-center"
                          style={{ gridColumn: "span 17 / span 17" }}
                        >
                          {player.dnpReason}
                        </div>
                      ) : (
                        STAT_COLUMNS.map((key) => (
                          <span
                            key={key}
                            className="text-center text-slate-100/90"
                          >
                            {player.stats?.[key] ?? "00"}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
