import type { NextRequest } from "next/server";
import { handleGoogleCallback } from "@/lib/auth/google-callback";

export async function GET(request: NextRequest) {
  return handleGoogleCallback(request);
}
