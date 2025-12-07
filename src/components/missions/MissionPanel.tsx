"use client";

import {
  Accordion
} from "@/components/ui/accordion";
import { useSession } from "next-auth/react";
import MissionRow from "./MissionRow";

export type Mission = {
  value: string;
  label: string;
  title: string;
  missionId: string;
  author: string;
};

const MISSIONS: Mission[] = [
  {
    value: "big-space",
    label: "BIG SPACE",
    title: "BIG SPACE",
    missionId: "3",
    author: "Fennella",
  },
  {
    value: "nebula-drills",
    label: "NEBULA DRILLS",
    title: "Nebula Drills",
    missionId: "4",
    author: "Fennella",
  },
  {
    value: "orbital-match",
    label: "ORBITAL MATCH",
    title: "Orbital Match",
    missionId: "5",
    author: "Fennella",
  },
];

export function MissionTerminal() {
  const { data: session } = useSession();
  console.log("session", session)

  return (
    <section className="w-full max-w-4xl px-4">
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
            Available missions: <span className="font-semibold">4</span>
          </p>
        </header>

        <div className="px-6 pb-5 pt-4">
          <Accordion
            type="single"
            collapsible
            defaultValue="big-space"
            className="space-y-3"
          >
            {MISSIONS.map((mission) => (
              <MissionRow key={mission.value} mission={mission} />
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}


