"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import PositionCard from "@/components/hangar/PositionCard";
import { X } from "lucide-react";
import { BoxScoreCard } from "./BoxScoreCard";
import { sections } from "./sectionsMockData";

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

interface HangarProps {
  onClose?: () => void;
}

export default function Hangar({ onClose }: HangarProps) {
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
      {/* <PseudoPlay onClose={onClose} /> */}
      <div className="my-4 w-full overflow-x-auto custom-scroll-thin">
        <div className="flex">
          <BoxScoreCard teamName="Miami Heat" sections={sections} />
          <BoxScoreCard teamName="Orlando Magic" sections={sections} />
        </div>
      </div>
      <Card className="relative h-full border-primary bg-orange-24 p-6 text-orange-100">
        {onClose && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Close hangar"
            onClick={onClose}
            className="absolute right-3 top-3 h-8 w-8 rounded-full text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <p className="text-[22px] text-secondary">Deployment base</p>
        <p className="text-card-bg">
          This is your starting point. Your role will determine the course of
          the galaxy.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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

        <Card className="mt-6 border-primary bg-orange-24">
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
                      "flex items-center gap-3 rounded-xl px-2 py-1",
                      checked ? "bg-orange-400/10" : "",
                    ].join(" ")}
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(v) =>
                        setLeagueState((prev) => ({ ...prev, [l]: Boolean(v) }))
                      }
                      className="h-5 w-5 cursor-pointer border-2 border-white/80 bg-transparent text-orange-400 data-[state=checked]:border-orange-400 data-[state=checked]:bg-transparent"
                    />
                    <Label
                      htmlFor={id}
                      className="font-bold tracking-wide text-white"
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

      <div className="mt-4 text-right">
        <p className="text-[16px] lowercase text-card-bg">
          Everything is at stake... the boldest will write history.
        </p>
        <Button
          disabled={!canStart}
          className={`mt-2 rounded-full cursor-pointer ${
            canStart
              ? "bg-green-600 hover:bg-green-500"
              : "bg-grey-light cursor-not-allowed"
          }`}
        >
          Start mission
        </Button>
      </div>
    </>
  );
}
