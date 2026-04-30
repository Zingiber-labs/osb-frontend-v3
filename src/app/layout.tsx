import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const apexMk2 = localFont({
  src: [
    {
      path: "../../public/fonts/ApexMk2-Regular.woff",
      weight: "300",
      style: "normal",
    },
  ],
  variable: "--font-apex",
  display: "swap",
});

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Outer Sports Ballers - Alfa",
  description: "Created by Zingiber Labs",
  openGraph: {
    images: ["/img/logo_horizontal.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${apexMk2.variable} ${geist.variable} ${geistMono.variable} font-apex relative`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
