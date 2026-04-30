"use client";

import { useQuery } from "@tanstack/react-query";
import type { User } from "@/lib/auth/schemas";

export const SESSION_QUERY_KEY = ["session"] as const;

async function fetchSession(): Promise<User | null> {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (!res.ok) return null;
  const json = await res.json();
  return json ?? null;
}

export function useSession() {
  return useQuery<User | null>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  });
}
