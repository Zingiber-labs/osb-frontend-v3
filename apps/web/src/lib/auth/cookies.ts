export const ACCESS_TOKEN_COOKIE = "osb_at";
export const REFRESH_TOKEN_COOKIE = "osb_rt";
export const LEGACY_ACCESS_TOKEN_COOKIE = "access_token";

const ONE_DAY_SECONDS = 60 * 60 * 24;
const THIRTY_DAYS_SECONDS = ONE_DAY_SECONDS * 30;

export type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
};

const isProd = process.env.NODE_ENV === "production";

export function accessTokenCookieOptions(maxAge = ONE_DAY_SECONDS): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function refreshTokenCookieOptions(
  maxAge = THIRTY_DAYS_SECONDS,
): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/api/auth",
    maxAge,
  };
}

export function clearedCookieOptions(path = "/"): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path,
    maxAge: 0,
  };
}
