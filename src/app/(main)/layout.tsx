import { redirect } from "next/navigation";
import Footer from "@/components/footer/Footer";
import ClientLayout from "@/components/layout/ClientLayout";
import Navbar from "@/components/navbar/Navbar";
import MobileTabBar from "@/components/navbar/MobileTabBar";
import { Toaster } from "react-hot-toast";
import DailyLoginRewardsGate from "@/components/rewards/DailyLoginRewardsGate";
import { SessionHydrator } from "@/app/providers";
import { getSession } from "@/lib/auth/session";

export default async function MainLayout({
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
        <div className="flex flex-col min-h-screen pb-[calc(3.5rem+1px+env(safe-area-inset-bottom))] desktop:pb-0">
          <div className="lg:px-[5.625rem] flex-1">
            <div className="overlay" />
            <Navbar />
            <DailyLoginRewardsGate />
            {children}
          </div>
          <Footer />
        </div>
        {/*
          MobileTabBar renders INSIDE ClientLayout deliberately. `.layout` has
          `isolation: isolate`, so anything outside it can never be covered by
          content inside it — as a sibling the bar sat on top of the
          "Accepting mission…" blocker and the daily-rewards modal, letting a
          user tap through both. Inside, it shares the stacking context and a
          higher-z-index overlay wins normally.

          This is only safe because `.layout--menu > *` now lives in
          @layer components (see globals.css); unlayered, it would strip the
          bar's `position: fixed` on the home route.
        */}
        <MobileTabBar />
      </ClientLayout>
    </>
  );
}
