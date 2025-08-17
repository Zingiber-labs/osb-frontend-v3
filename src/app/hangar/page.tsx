"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import PositionCard from "@/components/hangar/PositionCard";

const positions = [
  { id: 1, label: "Shooting Guard", img: "/img/positions/shooting-guard.svg" },
  { id: 2, label: "Point Guard", img: "/img/positions/point-guard.svg" },
  { id: 3, label: "Center", img: "/img/positions/center.svg" },
  { id: 4, label: "Small Forward", img: "/img/positions/small-forward.svg" },
  { id: 5, label: "Power Forward", img: "/img/positions/power-forward.svg" },
];

const LEAGUES = [
  "NBA",
  "NCAA",
  "NAB",
  "WBA",
  "FIBA",
  "WNBA",
  "CBA",
  "EuroLeague",
  "ABL",
  "LNB",
] as const;

export default function HangarPage() {
  const [leagueState, setLeagueState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(LEAGUES.map((l) => [l, false]))
  );

  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  const canStart = useMemo(
    () => Object.values(leagueState).some(Boolean) && selectedPosition !== null,
    [leagueState, selectedPosition]
  );

  return (
    <>
      <Card className="h-full border-primary p-6 bg-orange-24 text-orange-100">
        <p className="text-[22px] text-secondary">Deployment base</p>
        <p className="text-card-bg">
          This is your starting point. Your role will determine the course of
          the galaxy.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {positions.map((position) => (
            <PositionCard
              key={position.id}
              srcUrl={position.img}
              alt={position.label}
              label={position.label}
              isSelected={selectedPosition === position.id}
              onSelect={() => setSelectedPosition(position.id)}
            />
          ))}
        </div>

        <Card className="bg-orange-24 mt-6 border-primary">
          <CardContent className="p-6">
            <p className="text-[22px] text-secondary">Choose your league</p>
            <p className="text-card-bg">
              Select a league that aligns and matches your strategy, style, and
              strength.
            </p>

            <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {LEAGUES.map((l) => {
                const id = `league-${l}`;
                const checked = !!leagueState[l];
                return (
                  <label
                    key={l}
                    htmlFor={id}
                    className={[
                      "flex items-center gap-3",
                      "rounded-xl px-2 py-1",
                      checked ? "bg-orange-400/10" : "",
                    ].join(" ")}
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(v) =>
                        setLeagueState((prev) => ({
                          ...prev,
                          [l]: Boolean(v),
                        }))
                      }
                      className="h-5 w-5 border-2 border-white/80 bg-transparent data-[state=checked]:border-orange-400 data-[state=checked]:bg-transparent data-[state=checked]:text-orange-400 cursor-pointer"
                    />
                    <Label
                      htmlFor={id}
                      className="text-white font-bold tracking-wide"
                    >
                      {l}
                    </Label>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </Card>

      <div className="text-right mt-4">
        <p className="text-card-bg text-[16px] lowercase">
          Everything is at stake... the boldest will write history.
        </p>
        <Button
          disabled={!canStart}
          className="rounded-full mt-2 cursor-pointer bg-green hover:bg-green-500 disabled:bg-grey-light"
        >
          Start mission
        </Button>
      </div>
    </>
  );
}
