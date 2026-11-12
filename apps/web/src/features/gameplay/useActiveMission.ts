"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchActiveMission } from "./api";

export const ACTIVE_MISSION_KEY = ["gameplay", "active-mission"] as const;

export function useActiveMission() {
  return useQuery({ queryKey: ACTIVE_MISSION_KEY, queryFn: fetchActiveMission, staleTime: 0 });
}
