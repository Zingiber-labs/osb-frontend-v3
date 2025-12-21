"use client";

import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import ClientLayout from "@/components/layout/ClientLayout";
import AuthSessionProvider from "@/providers/SessionProvider";
import { Toaster } from "react-hot-toast";
import { usePathname } from "next/navigation";

const noBackgroundRoutes = ["/gameplay"];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isNoBackgroundRoute = noBackgroundRoutes.includes(usePathname());

  return (
    <>
      {isNoBackgroundRoute ? (
        children
      ) : (
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
            <div className="flex flex-col min-h-screen">
              <div className="lg:px-[5.625rem] flex-1">
                <div className="overlay" />
                <Navbar />
                {children}
              </div>
              <Footer />
            </div>
          </ClientLayout>
        </AuthSessionProvider>
      )}
    </>
  );
}
