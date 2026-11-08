import "server-only";

// Keep the Docker address on the server; browser requests use the public URLs.
export const BACKEND_API_URL = (
  process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL
)?.replace(/\/+$/, "");
