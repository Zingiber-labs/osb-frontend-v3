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
        <div className="flex flex-col min-h-screen pb-[calc(3.5rem+env(safe-area-inset-bottom))] desktop:pb-0">
          <div className="lg:px-[5.625rem] flex-1">
            <div className="overlay" />
            <Navbar />
            <DailyLoginRewardsGate />
            {children}
          </div>
          <Footer />
        </div>
        <MobileTabBar />
      </ClientLayout>
    </>
  );
}
