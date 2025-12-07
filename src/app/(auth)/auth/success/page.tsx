"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AuthSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  useEffect(() => {
    if (!token) return;

    const doLogin = async () => {
      const res = await signIn("backend-token", {
        redirect: false,
        token,
      });

      if (res?.error) {
        router.replace("/login?error=google");
        return;
      }

      router.replace("/");
      router.refresh();
    };

    void doLogin();
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 text-center text-orange-50 bg-orange-dark h-screen">
      <div className="h-14 w-14 rounded-full border-4 border-cyan-400/40 border-t-cyan-300 animate-spin" />
      <h1 className="text-2xl font-bold text-cyan-200 tracking-wide">
        Signing you in...
      </h1>
      <p className="max-w-sm text-sm text-orange-100/80">
        We&apos;re finalizing your Google sign in. This will only take a
        moment.
      </p>
    </div>
  );
}
