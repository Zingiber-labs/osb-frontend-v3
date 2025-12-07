import type { Metadata } from "next";

import AuthSessionProvider from "@/providers/SessionProvider";
import "../globals.css";

export const metadata: Metadata = {
  title: "Login - Outer Sports Ballers",
  description: "Login to Outer Sports Ballers",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
