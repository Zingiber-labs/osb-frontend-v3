"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchActiveMission } from "./api";

export const ACTIVE_MISSION_KEY = ["gameplay", "active-mission"] as const;

export function useActiveMission() {
  // Always refetched on mount and never kept between visits: a cached null must not redirect a user who has since accepted a mission.
  return useQuery({ queryKey: ACTIVE_MISSION_KEY, queryFn: fetchActiveMission, staleTime: 0, gcTime: 0 });
}
