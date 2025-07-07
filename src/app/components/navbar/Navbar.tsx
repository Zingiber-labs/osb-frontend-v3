import SiteLogo from "../siteLogo/SiteLogo";
import NavMenu from "./NavMenu";
import UserProfile from "./UserProfile";
import { navLinks } from "./navLinks";

const Navbar = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-transparent">
      <SiteLogo size="medium" imageSrc="/img/logo_horizontal.svg" />
      <NavMenu links={navLinks} />
      <UserProfile name="Usuario" avatar= "/img/user-example.jpg" />
    </header>
  );
};

export default Navbar;
