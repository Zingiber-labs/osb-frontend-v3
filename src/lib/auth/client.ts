"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SESSION_QUERY_KEY } from "@/hooks/useSession";
import type {
  LoginInput,
  SignupInput,
  User,
} from "@/lib/auth/schemas";

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const errBody = await res.json();
      message = errBody?.error || errBody?.message || message;
    } catch {}
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => post<User | null>("/api/auth/login", input),
    onSuccess: (user) => {
      qc.setQueryData(SESSION_QUERY_KEY, user);
      qc.invalidateQueries();
    },
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SignupInput) =>
      post<User | null | { ok: boolean }>("/api/auth/signup", input),
    onSuccess: (result) => {
      if (result && typeof result === "object" && "id" in result) {
        qc.setQueryData(SESSION_QUERY_KEY, result);
        qc.invalidateQueries();
      }
    },
  });
}

export function useGuestLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post<User | null>("/api/auth/guest"),
    onSuccess: (user) => {
      qc.setQueryData(SESSION_QUERY_KEY, user);
      qc.invalidateQueries();
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post<{ ok: true }>("/api/auth/logout"),
    onSuccess: () => {
      qc.setQueryData(SESSION_QUERY_KEY, null);
      qc.clear();
    },
  });
}

export function startGoogleLogin() {
  if (typeof window === "undefined") return;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return;
  const redirectUrl = encodeURIComponent(`${window.location.origin}/api/auth/callback`);
  window.location.href = `${apiUrl}/auth/google?redirectUrl=${redirectUrl}`;
}
