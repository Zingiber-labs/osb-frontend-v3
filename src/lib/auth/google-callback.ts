import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  accessTokenCookieOptions,
} from "@/lib/auth/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function handleGoogleCallback(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const origin = request.nextUrl.origin;

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
