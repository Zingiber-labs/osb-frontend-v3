"use client";
import { useRouter } from "next/navigation";
import React from "react";
import Button from "../commons/button/Button";

interface NavLinkProps {
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const NavLink = (props: NavLinkProps) => {
  const { label, href, onClick, className = "" } = props;
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }

    if (href) {
      e.preventDefault();
      router.push(href);
    }
  };

  return (
    <Button
      variant="link"
      onClick={handleClick}
      className={`text-white hover:text-white/90 transition-colors ${className}`}
    >
      {label}
    </Button>
  );
};

export default NavLink;
