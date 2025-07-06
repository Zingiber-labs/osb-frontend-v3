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
  return (
    <Button
      variant="link"
      onClick={onClick}
      className={`text-white hover:text-white/90 transition-colors ${className}`}
    >
      {label}
    </Button>
  );
};

export default NavLink;
