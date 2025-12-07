import { Suspense } from "react";
import AuthSuccessClient from "./AuthSuccessClient";

export default function AuthSuccessPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <AuthSuccessClient />
    </Suspense>
  );
}
