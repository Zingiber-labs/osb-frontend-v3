import type { Metadata } from "next";

import AuthSessionProvider from "@/providers/SessionProvider";
import "../globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Gameplay - Outer Sports Ballers",
  description: "Gameplay in Outer Sports Ballers",
};

export default function GameplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthSessionProvider>
      <ClientLayout>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0f172a",
              color: "white",
              border: "1px solid #38bdf8",
            },
          }}
        />
        {children}
      </ClientLayout>
    </AuthSessionProvider>
  );
}
