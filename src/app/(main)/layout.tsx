"use client";

import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import ClientLayout from "@/components/layout/ClientLayout";
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
        <ClientLayout>
          <div className='flex flex-col min-h-screen'>
            <div className='lg:px-[5.625rem] flex-1'>
              <div className='overlay' />
              <Navbar />
              {children}
            </div>
            <Footer />
          </div>
        </ClientLayout>
      )}
    </>
  );
}
