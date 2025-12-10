"use client";

import Hangar from "@/components/hangar/Hangar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlayers } from "@/hooks/hangar/usePlayers";
import { useSpin } from "@/hooks/hangar/useSpin";
import { useMemo, useState } from "react";

type Stat = { label: string; value: number };

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div className="relative w-full">
      <div className="h-2.5 w-full rounded-full bg-white/10">
        <div
          className="h-2.5 rounded-full bg-cyan-400 transition-[width]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default function HangarPage() {
  const [showHangar, setShowHangar] = useState(false);
  const { data } = usePlayers();
  const [selectedPlayer, setSelectedPlayer] = useState("");

  console.log("players data", data);

  const { isPending } = useSpin("generalist");

  const level = 5;
  const nextLevel = level + 1;
  const xp = 230;
  const xpMax = 600;

  const stats: Stat[] = useMemo(
    () => [
      { label: "Energy", value: 100 },
      { label: "Ammo", value: 100 },
      { label: "Shields", value: 100 },
      { label: "Difficulty", value: 100 },
      { label: "Planet", value: 100 },
      { label: "Mission", value: 100 },
      { label: "Points", value: 100 },
    ],
    []
  );

  const handlePlay = () => {
    // const username = user?.username;

    // if (!username) {
    //   return;
    // }
    // mutate(
    //   { username },
    //   {
    //     onSuccess: () => {
    //       setShowHangar(true);
    //     },
    //   }
    // );
    setShowHangar(true);
  };

  if (showHangar) {
    return <Hangar onClose={() => setShowHangar(false)} />;
  }

  return (
    <div className="relative mx-auto max-w-[1240px] px-4 py-8 md:py-12">
      <div className="relative grid grid-cols-1 gap-6 md:grid-cols-[360px_1fr]">
        <div className="text-white">
          <Label className="text-sm font-helvetica">Select your Player</Label>
          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="w-[300px] text-white bg-orange-dark cursor-pointer mt-4">
              <SelectValue className="text-white font-helvetica" placeholder="Select Player" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {data?.map((player: any) => (
                  <SelectItem className="font-helvetica" key={player.id} value={String(player.id)}>
                    {player.fullName} – {player.teamName}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-start-2 md:row-start-1">
          <div className="md:absolute md:right-0 md:top-0">
            <div className="w-full max-w-[360px] rounded-2xl border border-primary-orange/80 bg-orange-24/95 p-5 text-right text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm">
              <h3 className="text-lg font-extrabold leading-snug tracking-wider">
                MAKE YOUR CHOICES FOR A
                <br />
                NEW ADVENTURE IN SPACE
              </h3>

              <Button
                onClick={handlePlay}
                disabled={isPending}
                className="mt-5 w-full rounded-full bg-cyan-300 px-8 py-6 text-sm font-extrabold uppercase tracking-widest text-black shadow-[0_14px_34px_rgba(0,255,255,0.35)] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Loading..." : "Play"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
