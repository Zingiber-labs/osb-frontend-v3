"use client";

import Hangar from "@/components/hangar/Hangar";
import PlayerAutocomplete from "@/components/hangar/PlayerAutocomplete";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePlayers } from "@/hooks/hangar/usePlayers";
import { useSpin } from "@/hooks/hangar/useSpin";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HangarPage() {
  const router = useRouter();

  const [showHangar, setShowHangar] = useState(false);
  const { data: players } = usePlayers();
  const [selectedPlayer, setSelectedPlayer] = useState("");

  const { isPending } = useSpin("generalist");

  const selectedPlayerData = players?.find(
    (p: any) => String(p.id) === selectedPlayer,
  );

  const handlePlay = () => {
    const gameId = selectedPlayerData?.gameId;
    const playerId = selectedPlayerData?.id;
    if (!gameId || !playerId) return;

    router.push(
      `/game-play?gameId=${encodeURIComponent(String(gameId))}&playerId=${encodeURIComponent(
        String(playerId),
      )}`,
    );
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

          <PlayerAutocomplete
            players={players}
            value={selectedPlayer}
            onValueChange={setSelectedPlayer}
            placeholder="Players"
          />
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

        <div className="md:col-start-3 md:row-start-1 flex justify-stretch desktop:justify-end">
          <div className="w-full desktop:max-w-[320px] rounded-2xl border border-primary-orange/80 bg-orange-24/95 p-5 text-left desktop:text-right text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm">
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
              <p className="mt-2 text-[11px] text-slate-100/75 text-left desktop:text-right">
                Select a player to start.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
