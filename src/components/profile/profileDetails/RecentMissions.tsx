"use client";

import { useRecentMissions } from "@/hooks/missions/useMission";
import MissionCard from "./MissionCard";
import { Loader } from "lucide-react";

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US");
}

export default function RecentMissions() {
  const { data, isLoading } = useRecentMissions();

  return (
    <section className="border border-secondary-cyan/50 rounded-lg p-4 sm:p-6 bg-[#24282B] shadow-[0_0_10px_rgba(45,255,254,0.5)]">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-white text-xl sm:text-2xl font-bold">
          Recent Missions
        </h2>
      </div>

      {isLoading ? (
        <div className="py-8">
          <Loader />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data?.map((m: any) => (
            <MissionCard
              key={m.id}
              name={m.mission?.name ?? "Unknown mission"}
              result={m.isCompleted ? "success" : "failure"}
              points={m.mission?.rewards?.xp ?? 0}
              date={formatDate(m.completedAt || m.createdAt)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
