"use client";

import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/button";

export const AuthPanel = () => {
  const { isAuthenticated, isGuest, isLoading } = useAuth();

  const status = isLoading
    ? "loading"
    : !isAuthenticated
    ? "unauthenticated"
    : isGuest
    ? "guest"
    : "authenticated";

  const statusText: Record<string, string> = {
    loading: "CHECKING AUTH...",
    unauthenticated: "NOT AUTHENTICATED",
    guest: "GUEST USER",
    authenticated: "USER AUTHENTICATED",
  };

  const statusStyle: Record<
    string,
    { color: string; shadow: string; glow: string }
  > = {
    loading: {
      color: "#A0AEC0",
      shadow: "0 0 10px rgba(160, 174, 192, 0.6)",
      glow: "0 0 8px rgba(160, 174, 192, 0.3)",
    },
    unauthenticated: {
      color: "#FF3B3B",
      shadow: "0 0 10px rgba(255, 59, 59, 0.8)",
      glow: "0 0 18px rgba(255, 59, 59, 0.4)",
    },
    guest: {
      color: "#FFD44D",
      shadow: "0 0 10px rgba(255, 212, 77, 0.8)",
      glow: "0 0 18px rgba(255, 212, 77, 0.5)",
    },
    authenticated: {
      color: "#00FF80",
      shadow: "0 0 10px rgba(0, 255, 128, 0.9)",
      glow: "0 0 20px rgba(0, 255, 128, 0.4)",
    },
  };

  const { color, shadow, glow } = statusStyle[status];

  return (
    <>
      <div className="absolute top-4 left-4 z-50 w-[300px] h-[220px]">
        <Image
          src="/img/notification.png"
          alt="Auth Status Panel"
          fill
          className="object-contain"
          priority
        />

        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none uppercase font-semibold tracking-[0.12em]"
          style={{
            transform:
              "perspective(700px) rotateX(10deg) rotateY(31deg) skewX(-4deg) translateX(13px) translateY(-45px)",
          }}
        >
          <span
            className="leading-none text-center text-[clamp(12px,2.2vw,18px)] animate-[panel-flicker_4s_infinite]"
            style={{
              color,
              textShadow: `${shadow}, ${glow}`,
            }}
          >
            {statusText[status]}
          </span>

          <div className="absolute inset-[14%_10%] scanlines rounded-md" />
        </div>
      </div>
    </>
  );
};
