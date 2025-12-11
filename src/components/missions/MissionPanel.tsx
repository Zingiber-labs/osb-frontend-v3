"use client";

import { Accordion } from "@/components/ui/accordion";
import { useSession } from "next-auth/react";
import MissionRow from "./MissionRow";
import { useMissions } from "@/hooks/missions/useMission";
import { Loader } from "lucide-react";
import { Mission } from "@/types/mission";
import Image from "next/image";

export function MissionTerminal() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.backendUserId;

  const { data: missions, isPending } = useMissions({ userId });

  const availableMissionsCount = missions?.length;

  return (
    <section className="w-full max-w-4xl px-4">
      <div className="w-full max-w-4xl px-4">
        <div
          className="
          relative rounded-[28px]
          border border-[#3be3ff]
          bg-[radial-gradient(circle_at_top,_#19496fff_0%,_#051523ff_55%,_#020711ff_100%)]
          shadow-[0_0_45px_rgba(56,189,248,0.7)]
          text-slate-50
        "
        >
          {/* HEADER */}
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
       <div className="w-full max-w-4xl">
        <Image
          src="/img/missions/console_mission.svg"
          alt="console mission"
          width={1024}
          height={120}
          className="w-full h-auto mb-6 cursor-pointer"
        />
      </div>
    </section>
  );
}
