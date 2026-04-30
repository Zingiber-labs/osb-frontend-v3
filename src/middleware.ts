import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  LEGACY_ACCESS_TOKEN_COOKIE,
} from "@/lib/auth/cookies";

const PUBLIC_ROUTES = new Set<string>([
  "/login",
  "/signup",
  "/forgot-password",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  const token =
    req.cookies.get(ACCESS_TOKEN_COOKIE)?.value ??
    req.cookies.get(LEGACY_ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|img|images|fonts|.*\\..*).*)",
  ],
};
