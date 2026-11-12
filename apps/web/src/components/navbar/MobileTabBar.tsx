"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "./navLinks";

const MobileTabBar = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-primary-orange/50 bg-black/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] desktop:hidden"
    >
      <ul className="flex">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isActive ? "text-primary-orange" : "text-white/60"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileTabBar;
