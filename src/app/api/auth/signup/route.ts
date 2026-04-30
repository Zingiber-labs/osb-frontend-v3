import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/auth/cookies";
import {
  BackendAuthResponseSchema,
  SignupInputSchema,
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

  const parsed = SignupInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    cache: "no-store",
  });

  if (!registerRes.ok) {
    let message = "Registration failed";
    try {
      const errBody = await registerRes.json();
      message =
        errBody?.message ||
        errBody?.error ||
        errBody?.errors?.[0]?.message ||
        message;
    } catch {}
    return NextResponse.json({ error: message }, { status: registerRes.status });
  }

  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: parsed.data.email,
      password: parsed.data.password,
    }),
    cache: "no-store",
  });

  if (!loginRes.ok) {
    return NextResponse.json({ ok: true, autoLogin: false }, { status: 201 });
  }

  const tokenParsed = BackendAuthResponseSchema.safeParse(await loginRes.json());
  if (!tokenParsed.success) {
    return NextResponse.json({ ok: true, autoLogin: false }, { status: 201 });
  }

  const { access_token, refresh_token } = tokenParsed.data;

  const profileRes = await fetch(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });
  const profileJson = profileRes.ok ? await profileRes.json() : null;
  const user = normalizeProfile(profileJson, "user");

  const response = NextResponse.json(user, { status: 201 });
  response.cookies.set(ACCESS_TOKEN_COOKIE, access_token, accessTokenCookieOptions());
  if (refresh_token) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, refresh_token, refreshTokenCookieOptions());
  }
  return response;
}
