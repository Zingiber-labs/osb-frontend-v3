"use client";

import Hangar from "@/components/hangar/Hangar";
import { Button } from "@/components/ui/button";
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
          <div className="rounded-2xl border border-primary-orange/80 bg-orange-24/95 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.35)]">
            <h2 className="text-[22px] font-extrabold tracking-wider text-cyan-300">
              SHIP CONTROL
            </h2>
            <p className="mt-1 text-sm text-white/80">
              You have your ship at 100% speed.
            </p>

            {/* Weapon level */}
            <div className="mt-6">
              <p className="text-[13px] font-bold tracking-widest text-white/90">
                WEAPON LEVEL
              </p>

              <div className="mt-1 flex items-center gap-2 text-[11px] text-white/75">
                <span className="tabular-nums">LVL {level}</span>
                <span className="opacity-60">▸</span>
                <span className="tabular-nums">LVL {nextLevel}</span>
                <span className="ml-auto tabular-nums">
                  {xp}/{xpMax} XP
                </span>
              </div>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-1.5 bg-orange-400"
                  style={{ width: `${(xp / xpMax) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 space-y-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="grid grid-cols-[110px_1fr_42px] items-center gap-3"
                >
                  <span className="text-[13px] font-semibold text-white/90">
                    {s.label}
                  </span>
                  <ProgressBar value={s.value} />
                  <span className="text-right text-[12px] tabular-nums text-white/70">
                    {s.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
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
