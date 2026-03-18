"use client";

import { useState } from "react";
import MissionCard from "./MissionCard";
import MissionDetailsDialog from "./MissionDetailsDialog";
import { useRecentMissions } from "@/hooks/missions/useMission";

type RecentMissionItem = {
  id: string;
  missionId: string;
  mission: {
    name: string;
    description: string;
    author: string;
    minPlayers: number;
    maxPlayers: number | null;
    requirements?: Record<string, number>;
    prerequisites?: string[] | string | null;
    rewards?: {
      xp?: number;
      coins?: number;
      gems?: number;
    };
    isRepeatable?: boolean;
    cooldownMinutes?: number | null;
  };
  progress?: {
    current?: number;
    target?: number;
  };
  isCompleted: boolean;
  isClaimed: boolean;
  completedAt: string | null;
  createdAt: string;
};

function formatDate(date?: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US");
}

export default function RecentMissions() {
  const { data = [] } = useRecentMissions();
  const [selectedMission, setSelectedMission] = useState<RecentMissionItem | null>(null);
  const [open, setOpen] = useState(false);

  const handleOpen = (mission: RecentMissionItem) => {
    setSelectedMission(mission);
    setOpen(true);
  };

  return (
    <>
      <div className="border border-secondary-cyan/50 rounded-lg p-6 bg-[#24282B] shadow-[0_0_10px_rgba(45,255,254,0.5)]">
        <h2 className="mb-6 text-2xl font-bold uppercase text-white">
          Recent Missions
        </h2>

        <div className="space-y-4">
          {data.map((item: RecentMissionItem) => (
            <MissionCard
              key={item.id}
              name={item.mission.name}
              result={item.isCompleted ? "success" : "failure"}
              xp={item.mission.rewards?.xp ?? 0}
              coins={item.mission.rewards?.coins ?? 0}
              gems={item.mission.rewards?.gems ?? 0}
              date={formatDate(item.completedAt || item.createdAt)}
              onClick={() => handleOpen(item)}
            />
          ))}
        </div>
      </div>

      <MissionDetailsDialog
        open={open}
        onOpenChange={setOpen}
        mission={selectedMission}
      />
    </>
  );
}