import "server-only";
import { BACKEND_API_URL as API_URL } from "@/lib/api/server";
import { cache } from "react";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "./cookies";
import { normalizeProfile, type User } from "./schemas";

async function fetchProfile(token: string, type: User["type"]): Promise<User | null> {
  if (!API_URL) return null;

  try {
    const res = await fetch(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const raw = await res.json();
    return normalizeProfile(raw, type);
  } catch {
    return null;
  }
}

export const getSession = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;
  return fetchProfile(token, "user");
});

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}
