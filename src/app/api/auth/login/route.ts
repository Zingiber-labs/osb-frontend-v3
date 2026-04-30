import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/auth/cookies";
import {
  BackendAuthResponseSchema,
  LoginInputSchema,
  normalizeProfile,
} from "@/lib/auth/schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: Request) {
  if (!API_URL) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = LoginInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const backendRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    cache: "no-store",
  });

  if (!backendRes.ok) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const tokenJson = await backendRes.json();
  const tokenParsed = BackendAuthResponseSchema.safeParse(tokenJson);
  if (!tokenParsed.success) {
    return NextResponse.json(
      { error: "Unexpected backend response" },
      { status: 502 },
    );
  }

  const { access_token, refresh_token } = tokenParsed.data;

  const profileRes = await fetch(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });
  const profileJson = profileRes.ok ? await profileRes.json() : null;
  const user = normalizeProfile(profileJson, "user");

  const response = NextResponse.json(user);
  response.cookies.set(ACCESS_TOKEN_COOKIE, access_token, accessTokenCookieOptions());
  if (refresh_token) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, refresh_token, refreshTokenCookieOptions());
  }
  return response;
}
