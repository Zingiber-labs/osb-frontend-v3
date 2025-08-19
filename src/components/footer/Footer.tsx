"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Instagram, Youtube, X } from "lucide-react"; // Usa iconos de lucide-react para las redes

const Footer = () => {
  return (
    <footer className="relative w-full bg-gradient-to-t from-black via-black/90 to-transparent text-white py-6 mt-auto">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 px-4">
        
        <div className="flex-shrink-0">
          <Image
            src="/img/logo_horizontal.svg"
            alt="Outer Sports Ballers"
            width={160}
            height={50}
          />
        </div>

        <Button className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-full px-6 py-2">
          SUPPORT
        </Button>

        <div className="flex items-center gap-4 text-cyan-400">
          <Instagram className="w-6 h-6 cursor-pointer hover:text-cyan-300 transition-colors" />
          <X className="w-6 h-6 cursor-pointer hover:text-cyan-300 transition-colors" />
          <Youtube className="w-6 h-6 cursor-pointer hover:text-cyan-300 transition-colors" />
        </div>

        <div className="text-sm text-orange-32 flex items-center gap-1">
          <span>©</span> All rights reserved
        </div>
      </div>
    </footer>
  );
};

export default Footer;
