import Footer from "@/components/footer/Footer";
import ClientLayout from "@/components/layout/ClientLayout";
import Navbar from "@/components/navbar/Navbar";
import AuthSessionProvider from "@/providers/SessionProvider";
import { Toaster } from "react-hot-toast";

export default function MainLayout({
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
  );
}
