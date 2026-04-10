"use client";
import SiteLogo from "../siteLogo/SiteLogo";
import NavMenu from "./NavMenu";
import UserProfile from "./UserProfile";
import { navLinks } from "./navLinks";
import { NotificationBell } from "../notifications/NotificationBell";

const Navbar = () => {
  return (
    <header className="flex h-[6.5rem] items-center justify-between p-4 bg-transparent">
      <SiteLogo size="medium" imageSrc="/img/logo_horizontal.svg" />
      <NavMenu links={navLinks} />
      <div className="flex items-center gap-4">
        <NotificationBell />
        <UserProfile className="" href="/profile" />
      </div>
    </header>
  );
};

export default Navbar;
