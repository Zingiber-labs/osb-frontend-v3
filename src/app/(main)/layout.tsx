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
      </ClientLayout>
      {/*
        MobileTabBar must render as a sibling of ClientLayout, not a child.
        ClientLayout applies `.layout--menu` on the home route, and globals.css
        has an unlayered `.layout--menu > * { position: relative; z-index: 2; }`
        rule that beats Tailwind's `@layer utilities` `.fixed` per the CSS
        cascade-layers spec regardless of specificity/order. As a direct child
        it would lose `position: fixed` on `/`. It's app chrome, not page
        content, so it doesn't need the tint-lifting rule; `.layout` has
        `isolation: isolate` so it still paints above correctly as a sibling.
      */}
      <MobileTabBar />
    </>
  );
}
