"use client";

import { Accordion } from "@/components/ui/accordion";
import { useMissions, useAcceptMission } from "@/hooks/missions/useMission";
import { Mission } from "@/types/mission";
import { Loader } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import MissionRow from "./MissionRow";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export function MissionTerminal() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.backendUserId;

  const { data: missions = [], isPending } = useMissions({ userId });

  const availableMissionsCount = missions.length;

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (missions.length === 0) {
      setSelectedIndex(0);
      return;
    }

    if (selectedIndex > missions.length - 1) {
      setSelectedIndex(0);
    }
  }, [missions.length, selectedIndex]);

  const selectedMission: Mission | undefined = useMemo(
    () => missions[selectedIndex],
    [missions, selectedIndex]
  );

  const { mutate: acceptMission, isPending: isAccepting } = useAcceptMission({
    userId,
  });

  const handlePrev = () => {
    if (!missions.length) return;
    setSelectedIndex((prev) => (prev === 0 ? missions.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (!missions.length) return;
    setSelectedIndex((prev) => (prev === missions.length - 1 ? 0 : prev + 1));
  };

  const handleAccept = () => {
    if (!selectedMission) {
      toast.error("There is no mission selected.");
      return;
    }

    if (!userId) {
      toast.error("User not found.");
      return;
    }

    acceptMission(String(selectedMission.id), {
      onSuccess: () => {
        toast.success("Mission accepted!");
      },
      onError: () => {
        toast.error("Error accepting the mission.");
      },
    });
  };

  const accordionValue = selectedMission
    ? String(selectedMission.id)
    : undefined;

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
              <div
                className="
                  max-h-[320px]
                  overflow-y-auto
                  custom-scroll-thin
                  pr-1
                "
              >
                <Accordion
                  type="single"
                  collapsible
                  value={accordionValue}
                  onValueChange={(val) => {
                    if (!val) return;
                    const idx = missions.findIndex(
                      (m: Mission) => String(m.id) === val
                    );
                    if (idx !== -1) setSelectedIndex(idx);
                  }}
                  className="space-y-3"
                >
                  {missions.map((mission: Mission, index: number) => (
                    <MissionRow
                      key={String(mission.id)}
                      mission={mission}
                      isSelected={index === selectedIndex}
                      onSelect={() => setSelectedIndex(index)}
                    />
                  ))}

                  {missions.length === 0 && (
                    <p className="text-xs text-cyan-100/70">
                      No missions available for this pilot yet.
                    </p>
                  )}
                </Accordion>
              </div>
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
              alt="Go home"
              width={300}
              height={300}
              className="w-[70%] h-auto cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push("/")}
            />
          </div>

          <div className="w-[22%] flex justify-center">
            <Image
              src="/img/missions/arrow_hover_right.svg"
              alt="Go to hangar"
              width={300}
              height={300}
              className="w-[70%] h-auto cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push("/hangar")}
            />
          </div>

          <div className="flex-1 flex justify-center">
            <Image
              src="/img/missions/button_hover_accept.svg"
              alt="Accept mission"
              width={600}
              height={600}
              className={`w-[65%] h-auto cursor-pointer hover:scale-105 transition-transform ${
                isAccepting ? "opacity-60 pointer-events-none" : ""
              }`}
              onClick={handleAccept}
            />
          </div>
        </div>
      </div>
      {isAccepting && (
        <div
          className="
          fixed inset-0 
          bg-black/70 backdrop-blur-sm
          flex items-center justify-center
          z-[9999]
        "
        >
          <div className="flex flex-col items-center space-y-4">
            <Loader className="h-12 w-12 animate-spin text-cyan-300" />
            <p className="text-cyan-200 font-semibold tracking-wide">
              Accepting mission...
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
