"use client";
import { useAuth } from "@/contexts/AuthContext";
import SiteLogo from "../siteLogo/SiteLogo";
import NavMenu from "./NavMenu";
import UserProfile from "./UserProfile";
import { navLinks } from "./navLinks";

const Navbar = () => {
  const { isAuthenticated, isGuest, user } = useAuth();

  const userHref = isAuthenticated ? "/profile" : "/login";
  const userName = isAuthenticated
    ? isGuest
      ? "Guest"
      : user?.name || "User"
    : "Login";


  return (
    <header className="flex h-[6.5rem] items-center justify-between p-4 bg-transparent">
      <SiteLogo size="medium" imageSrc="/img/logo_horizontal.svg" />
      <NavMenu links={navLinks} />
      <UserProfile
        name={userName}
        avatar={"/img/user-example.jpg"}
        href={userHref}
      />
    </header>
  );
};

export default Navbar;
