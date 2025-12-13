"use client";

import { usePathname } from "next/navigation";
import React from "react";
import QueryProvider from "@/components/providers/QueryProvider";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function ClientLayout({ children, className = "" }: Props) {
  const pathname = usePathname();

  let layoutClass = "layout";

  switch (true) {
    case pathname?.toLowerCase().startsWith("/hangar"):
      layoutClass += " layout--hangar";
      break;
    case pathname?.toLowerCase().startsWith("/missions"):
      layoutClass += " layout--missions";
      break;
    case pathname === "/":
      layoutClass += " layout--menu";
      break;
    default:
      layoutClass += " layout--default";
  }

  return (
    <QueryProvider>
      <div className={`${layoutClass} ${className}`}>{children}</div>
    </QueryProvider>
  );
}
