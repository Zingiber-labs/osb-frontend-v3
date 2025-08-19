"use client";
import { useRouter } from "next/navigation";
import SiteLogo from "../siteLogo/SiteLogo";
import NavMenu from "./NavMenu";
import UserProfile from "./UserProfile";
import { navLinks } from "./navLinks";

const Navbar = () => {
  const router = useRouter();
  const onClickProfile = () => {
    router.push("/profile");
  };

  return (
    <header className="flex h-[6.5rem] items-center justify-between p-4 bg-transparent">
      <SiteLogo size="medium" imageSrc="/img/logo_horizontal.svg" />
      <NavMenu links={navLinks} />
      <UserProfile
        name="User"
        avatar="/img/user-example.jpg"
        onClick={onClickProfile}
      />
    </header>
  );
};

export default Navbar;
