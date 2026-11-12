import { NextResponse, type NextRequest } from "next/server";
import { BACKEND_API_URL as API_URL } from "@/lib/api/server";
import {
  ACCESS_TOKEN_COOKIE,
  accessTokenCookieOptions,
} from "@/lib/auth/cookies";

function resolvePublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = forwardedHost ?? request.headers.get("host");
  if (host) {
    const proto = forwardedProto ?? request.nextUrl.protocol.replace(":", "");
    return `${proto || "https"}://${host}`;
  }
  return request.nextUrl.origin;
}

export async function handleGoogleCallback(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const origin = resolvePublicOrigin(request);

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=google", origin));
  }

  if (!API_URL) {
    return NextResponse.redirect(new URL("/login?error=config", origin));
  }

  const profileRes = await fetch(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!profileRes.ok) {
    return NextResponse.redirect(new URL("/login?error=token", origin));
  }

  const response = NextResponse.redirect(new URL("/", origin));
  response.cookies.set(ACCESS_TOKEN_COOKIE, token, accessTokenCookieOptions());
  return response;
}
