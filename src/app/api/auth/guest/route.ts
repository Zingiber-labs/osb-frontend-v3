import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  accessTokenCookieOptions,
} from "@/lib/auth/cookies";
import {
  BackendAuthResponseSchema,
  normalizeProfile,
} from "@/lib/auth/schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST() {
  if (!API_URL) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const guestRes = await fetch(`${API_URL}/auth/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!guestRes.ok) {
    return NextResponse.json(
      { error: "Unable to create guest session" },
      { status: 502 },
    );
  }

  const tokenParsed = BackendAuthResponseSchema.safeParse(await guestRes.json());
  if (!tokenParsed.success) {
    return NextResponse.json(
      { error: "Unexpected backend response" },
      { status: 502 },
    );
  }

  const { access_token } = tokenParsed.data;

  const profileRes = await fetch(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });
  const profileJson = profileRes.ok ? await profileRes.json() : null;
  const user = normalizeProfile(profileJson, "guest");

  const response = NextResponse.json(user);
  response.cookies.set(ACCESS_TOKEN_COOKIE, access_token, accessTokenCookieOptions());
  return response;
}
