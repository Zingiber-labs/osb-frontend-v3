import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  LEGACY_ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearedCookieOptions,
} from "@/lib/auth/cookies";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", clearedCookieOptions("/"));
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", clearedCookieOptions("/api/auth"));
  response.cookies.set(LEGACY_ACCESS_TOKEN_COOKIE, "", clearedCookieOptions("/"));
  return response;
}
