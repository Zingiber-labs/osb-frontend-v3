import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  LEGACY_ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearedCookieOptions,
} from "@/lib/auth/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "host",
  "content-length",
  "content-encoding",
  "accept-encoding",
]);

async function forward(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  if (!API_URL) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const { path } = await ctx.params;
  const target = new URL(`${API_URL}/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((v, k) =>
    target.searchParams.append(k, v),
  );

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP.has(lower) && lower !== "cookie") {
      headers.set(key, value);
    }
  });
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(target, init);
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }

  const responseHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP.has(lower) && lower !== "set-cookie") {
      responseHeaders.set(key, value);
    }
  });

  const response = new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: responseHeaders,
  });

  if (backendRes.status === 401) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, "", clearedCookieOptions("/"));
    response.cookies.set(REFRESH_TOKEN_COOKIE, "", clearedCookieOptions("/api/auth"));
    response.cookies.set(LEGACY_ACCESS_TOKEN_COOKIE, "", clearedCookieOptions("/"));
  }

  return response;
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
