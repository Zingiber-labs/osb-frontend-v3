"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchActiveMission } from "./api";

export const ACTIVE_MISSION_KEY = ["gameplay", "active-mission"] as const;

export function useActiveMission() {
  // Fetched once per visit and never refetched while the screen is mounted: grading can complete the mission
  // mid-game, so a later null must not end the session. Never kept between visits either (staleTime/gcTime 0),
  // so a cached null cannot redirect a user who has since accepted a mission.
  return useQuery({
    queryKey: ACTIVE_MISSION_KEY,
    queryFn: fetchActiveMission,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
