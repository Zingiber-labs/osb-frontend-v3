import { Image } from "lucide-react";
import React from "react";

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

type BoxScoreCardProps = {
  teamName: string;
  sections: Section[];
};

const GRID_TEMPLATE = "220px repeat(17, minmax(2.5rem, 1fr))";

export const BoxScoreCard: React.FC<BoxScoreCardProps> = ({
  teamName,
  sections,
}) => {
  return (
    <section
      className="
        shrink-0
        w-[52rem]
        max-w-full
        rounded-[36px]
        shadow-2xl
        text-slate-100
        overflow-x-auto
        custom-scroll-thin
      "
    >
      <div className="inline-block">
        {/* Header */}
        <header className="flex">
          <div className="bg-[#983012] px-6 py-4 flex gap-4 w-1/2 min-w-[280px] rounded-tr-[36px]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/10">
              <Image className="h-4 w-4 text-slate-200" />
            </div>
            <h2 className="text-2xl font-extrabold uppercase tracking-[0.25em]">
              {teamName}
            </h2>
          </div>
        </header>

        <div className="relative bg-[url('/figure-hero.svg')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative px-6 pb-6 space-y-6 w-max">
            {sections.map((section) => (
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

            {/* TEAM  */}
            <div className="mt-4 border-t border-white/10 pt-3">
              <div
                className="grid items-center text-[11px] tabular-nums text-slate-100/90"
                style={{ gridTemplateColumns: GRID_TEMPLATE }}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
                  Team
                </span>
                {STAT_COLUMNS.map((col) => (
                  <span key={col} className="text-center">
                    00
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
