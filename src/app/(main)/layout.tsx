import Footer from "@/components/footer/Footer";
import ClientLayout from "@/components/layout/ClientLayout";
import Navbar from "@/components/navbar/Navbar";
import AuthSessionProvider from "@/providers/SessionProvider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthSessionProvider>
      <ClientLayout>
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
