import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "../globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import { Toaster } from "react-hot-toast";
import { SessionHydrator } from "@/app/providers";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Gameplay - Outer Sports Ballers",
  description: "Gameplay in Outer Sports Ballers",
};

export default async function GameplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <SessionHydrator session={session} />
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
    </>
  );
}
