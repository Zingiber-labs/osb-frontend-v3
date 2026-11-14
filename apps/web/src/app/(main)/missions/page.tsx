"use client";
import {MissionTerminal} from "@/components/missions/MissionPanel";

const MissionScreen = () => {
  return (
    <main className="relative w-full">
      <div className="absolute inset-0  bg-cover bg-center" />
      {/* <div className="absolute inset-0 bg-black/40" /> */}

      <div className="relative z-10 flex h-full items-center justify-center px-3 sm:px-6">
        <MissionTerminal />
      </div>
    </main>
  );
};

export default MissionScreen;