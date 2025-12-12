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
import Image from "next/image";
import { useState } from "react";

type Stat = { label: string; value: number };

export default function HangarPage() {
  const [showHangar, setShowHangar] = useState(false);
  const { data: players } = usePlayers();
  const [selectedPlayer, setSelectedPlayer] = useState("");

  const { isPending } = useSpin("generalist");

  const level = 5;
  const nextLevel = level + 1;
  const xp = 230;
  const xpMax = 600;

  const selectedPlayerData = players?.find(
    (p: any) => String(p.id) === selectedPlayer
  );

  const handlePlay = () => {
    if (!selectedPlayerData) return;
    setShowHangar(true);
  };

  if (showHangar) {
    return <Hangar onClose={() => setShowHangar(false)} />;
  }

  return (
    <div className="relative mx-auto max-w-[1240px] px-4 py-8 md:py-12">
      <div className="relative grid grid-cols-1 gap-6 md:grid-cols-[320px_minmax(0,1fr)_320px] items-start">
        <div className="text-white">
          <Label className="text-sm font-helvetica uppercase tracking-[0.18em]">
            Select your Player
          </Label>

          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="mt-4 w-[280px] text-left text-white bg-orange-dark cursor-pointer rounded-xl border border-orange-32/90 shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
              <SelectValue
                className="text-white font-helvetica"
                placeholder="Players"
              />
            </SelectTrigger>

            <SelectContent className="w-[280px]">
              <SelectGroup>
                {players?.map((player: any) => (
                  <SelectItem
                    className="font-helvetica"
                    key={player.id}
                    value={String(player.id)}
                  >
                    {player.fullName}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col items-center justify-center mt-6 md:mt-0">
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-slate-200/80">
            You Select
          </p>

          <div className="mt-2 inline-flex min-w-[240px] items-center justify-center rounded-full border border-slate-100/40 bg-black/30 px-6 py-2 text-center text-sm font-helvetica text-slate-50">
            {selectedPlayerData
              ? `${selectedPlayerData.fullName} - ${selectedPlayerData.teamName}`
              : "-----------"}
          </div>

          {/* AVATAR */}
          <div className="mt-6">
            <Image
              src="/img/hangar/avatar.png"
              alt="Selected player avatar"
              width={220}
              height={380}
              className="w-[200px] md:w-[220px] lg:w-[240px] h-auto select-none drop-shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
            />
          </div>
        </div>

        <div className="md:col-start-3 md:row-start-1 flex justify-end">
          <div className="w-full max-w-[320px] rounded-2xl border border-primary-orange/80 bg-orange-24/95 p-5 text-right text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <h3 className="text-lg font-extrabold leading-snug tracking-wider">
              MAKE YOUR CHOICES FOR A
              <br />
              NEW ADVENTURE IN SPACE
            </h3>

            <Button
              onClick={handlePlay}
              disabled={isPending || !selectedPlayerData}
              className="mt-5 w-full rounded-full bg-cyan-300 px-8 py-6 text-sm font-extrabold uppercase tracking-widest text-black shadow-[0_14px_34px_rgba(0,255,255,0.35)] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "Loading..." : "Play"}
            </Button>

            {!selectedPlayerData && (
              <p className="mt-2 text-[11px] text-slate-100/75 text-right">
                Select a player to start.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
