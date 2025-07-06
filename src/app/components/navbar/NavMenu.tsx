import React from "react";
import NavLink from "./NavLink";

interface NavMenuProps {
  links: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  className?: string;
}

const NavMenu = ({ links, className = "" }: NavMenuProps) => {
  return (
    <nav
      aria-label="Navegación principal"
      className={`hidden md:flex items-center space-x-6 ${className}`}
    >
      {links.map((link, index) => (
        <NavLink
          key={`nav-link-${index}`}
          label={link.label}
          href={link.href}
          onClick={link.onClick}
        />
      ))}
    </nav>
  );
};

export default NavMenu;
