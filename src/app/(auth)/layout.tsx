import type { Metadata } from "next";
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
  return <>{children}</>;
}
