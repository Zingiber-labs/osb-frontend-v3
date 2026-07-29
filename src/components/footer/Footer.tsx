"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Instagram, Youtube, X } from "lucide-react"; // Usa iconos de lucide-react para las redes

const Footer = () => {
  return (
    <footer className="relative w-full bg-gradient-to-t from-black via-black/90 to-transparent text-white py-3 desktop:py-6">
      <div className="container mx-auto flex flex-row flex-wrap desktop:flex-nowrap justify-between items-center gap-3 desktop:gap-6 px-4">
        <div className="flex-shrink-0">
          {/* desktop:h-[50px] restores the pre-existing rendering exactly: the
              logo's natural aspect is 146x40, so h-auto alone renders 160x44,
              whereas the width/height attributes previously stretched it to
              160x50. Mobile intentionally uses the undistorted h-auto. */}
          <Image
            src="/img/logo_horizontal.svg"
            alt="Outer Sports Ballers"
            width={160}
            height={50}
            className="w-24 h-auto desktop:w-40 desktop:h-[50px]"
          />
        </div>

        <Button className="hidden desktop:inline-flex bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-full px-6 py-2">
          SUPPORT
        </Button>

        <div className="flex items-center gap-4 text-cyan-400">
          <Instagram className="w-5 h-5 desktop:w-6 desktop:h-6 cursor-pointer hover:text-cyan-300 transition-colors" />
          <X className="w-5 h-5 desktop:w-6 desktop:h-6 cursor-pointer hover:text-cyan-300 transition-colors" />
          <Youtube className="w-5 h-5 desktop:w-6 desktop:h-6 cursor-pointer hover:text-cyan-300 transition-colors" />
        </div>

        <a
          href="#"
          className="desktop:hidden text-xs text-cyan-400 underline underline-offset-2"
        >
          Support
        </a>

        <div className="text-xs desktop:text-sm text-orange-32 flex items-center gap-1">
          <span>©</span> All rights reserved
        </div>
      </div>
    </footer>
  );
};

export default Footer;
