"use client";

const BFF_PREFIX = "/api/backend";

export type ApiResponse<T = any> = {
  data: T;
  status: number;
  headers: Headers;
};

export class ApiError<T = any> extends Error {
  constructor(
    public readonly status: number,
    public readonly data: T,
    message?: string,
  ) {
    super(message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
  }
}

function joinUrl(path: string, params?: Record<string, unknown>): string {
  const isAbsolute = /^https?:\/\//i.test(path);
  const normalized = isAbsolute
    ? path
    : `${BFF_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;

  if (!params || Object.keys(params).length === 0) return normalized;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
    } else {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  if (!qs) return normalized;
  return normalized + (normalized.includes("?") ? "&" : "?") + qs;
}

async function parseBody(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  if (ct.startsWith("text/")) return res.text();
  return null;
}

function handleUnauthorized(status: number) {
  if (status !== 401) return;
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  window.location.assign("/login");
}

export type RequestOptions = RequestInit & {
  params?: Record<string, unknown>;
};

async function request<T = any>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<ApiResponse<T>> {
  const { params, ...init } = options ?? {};
  const headers = new Headers(init.headers);
  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(joinUrl(path, params), {
    ...init,
    method,
    headers,
    credentials: "same-origin",
    body: body !== undefined ? JSON.stringify(body) : init.body,
  });

  const data = (await parseBody(res)) as T;

  if (!res.ok) {
    handleUnauthorized(res.status);
    throw new ApiError(res.status, data);
  }

  return { data, status: res.status, headers: res.headers };
}

export const api = {
  get: <T = any>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),
  post: <T = any>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T = any>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T = any>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T = any>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
