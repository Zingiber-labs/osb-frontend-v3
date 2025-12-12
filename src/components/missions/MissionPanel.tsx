"use client";

import { Accordion } from "@/components/ui/accordion";
import { useMissions } from "@/hooks/missions/useMission";
import { Mission } from "@/types/mission";
import { Loader } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import MissionRow from "./MissionRow";

export function MissionTerminal() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.backendUserId;

  const { data: missions = [], isPending } = useMissions({ userId });

  const availableMissionsCount = missions.length;

  const handlePrev = () => {
    console.log("Prev mission");
  };

  const handleNext = () => {
    console.log("Next mission");
  };

  const handleAccept = () => {
    console.log("Accept mission");
  };

  return (
    <section className="w-full px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div
          className="
            relative rounded-[28px]
            border border-[#3be3ff]
            bg-[radial-gradient(circle_at_top,_#19496fff_0%,_#051523ff_55%,_#020711ff_100%)]
            shadow-[0_0_45px_rgba(56,189,248,0.7)]
            text-slate-50
          "
        >
          <header className="px-6 pt-3 pb-2 border-b border-cyan-500/50">
            <h1 className="text-center font-apex text-[19px] sm:text-[21px] tracking-[0.35em] text-white">
              MISSION TERMINAL
            </h1>
            <p className="mt-1 text-[11px] text-cyan-100">
              Available missions:{" "}
              <span className="font-semibold">
                {isPending ? "..." : availableMissionsCount}
              </span>
            </p>
          </header>

          <div className="px-6 pb-5 pt-4">
            {isPending ? (
              <div className="flex items-center justify-center py-10">
                <Loader className="h-8 w-8 animate-spin text-cyan-300" />
              </div>
            ) : (
              <Accordion
                type="single"
                collapsible
                defaultValue={missions[0]?.value}
                className="space-y-3"
              >
                {missions.map((mission: Mission) => (
                  <MissionRow key={String(mission.id)} mission={mission} />
                ))}

                {missions.length === 0 && (
                  <p className="text-xs text-cyan-100/70">
                    No missions available for this pilot yet.
                  </p>
                )}
              </Accordion>
            )}
          </div>
        </div>
      </div>
      <div className="w-full max-w-4xl mt-4 relative">
        <Image
          src="/img/missions/console_mission.svg"
          alt="console mission"
          width={1520}
          height={566}
          className="w-full h-auto select-none"
        />

        <div className="absolute inset-0 flex items-center px-[8%]">
          <div className="w-[22%] flex justify-center">
            <Image
              src="/img/missions/arrow_hover_left.svg"
              alt="Previous mission"
              width={300}
              height={300}
              className="w-[70%] h-auto cursor-pointer hover:scale-105 transition-transform"
              onClick={() => console.log("Prev mission")}
            />
          </div>

          <div className="w-[22%] flex justify-center">
            <Image
              src="/img/missions/arrow_hover_right.svg"
              alt="Next mission"
              width={300}
              height={300}
              className="w-[70%] h-auto cursor-pointer hover:scale-105 transition-transform"
              onClick={() => console.log("Next mission")}
            />
          </div>

          <div className="flex-1 flex justify-center">
            <Image
              src="/img/missions/button_hover_accept.svg"
              alt="Accept mission"
              width={600}
              height={600}
              className="w-[65%] h-auto cursor-pointer hover:scale-105 transition-transform"
              onClick={() => console.log("Accept mission")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
