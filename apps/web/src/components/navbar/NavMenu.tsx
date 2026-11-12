import React from "react";
import NavLink from "./NavLink";
import type { NavLink as NavLinkItem } from "./navLinks";

interface NavMenuProps {
  links: NavLinkItem[];
  className?: string;
}

const NavMenu = ({ links, className = "" }: NavMenuProps) => {
  return (
    <nav
      aria-label="Navegación principal"
      className={`hidden desktop:flex items-center space-x-6 ${className}`}
    >
      {links.map((link, index) => (
        <NavLink
          key={`nav-link-${index}`}
          label={link.label}
          href={link.href}
        />
      ))}
    </nav>
  );
};

export default NavMenu;
