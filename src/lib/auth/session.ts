import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "./cookies";
import { normalizeProfile, type User } from "./schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
