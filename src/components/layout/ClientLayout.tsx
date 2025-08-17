"use client";

import { usePathname } from "next/navigation";
import React from "react";

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
    case pathname === "/":
      layoutClass += " layout--menu";
      break;
    default:
      layoutClass += " layout--default";
  }

  return <div className={`${layoutClass} ${className}`}>{children}</div>;
}