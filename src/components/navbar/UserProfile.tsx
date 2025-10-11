import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface UserProfileProps {
  name: string;
  avatar?: string;
  className?: string;
  href: string;
}

const UserProfile = (props: UserProfileProps) => {
  const { name, avatar = "/img/user-example.jpg", className = "" } = props;
  const router = useRouter();

  const { isAuthenticated, logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className={`${className} flex items-center gap-4`}>
      <div className="flex gap-3 items-center">
        {!isAuthenticated && (
          <Link className="text-secondary" href={"#"}>
            Play as a Guest
          </Link>
        )}
        <Link
          href={`${isAuthenticated ? "/profile" : "/login"}`}
          className="block text-sm text-white"
        >
          {name}
        </Link>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={!isAuthenticated}
            variant="ghost"
            className="relative h-8 w-8 rounded-full"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatar} alt="avatar" />
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex gap-4" onClick={() => router.push("/profile")}>
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatar} alt="avatar" />
              </Avatar>
              <div className="flex justify-center items-center">
                <p className="text-sm font-medium leading-none">{name}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="hover:cursor-pointer"
          >
            <LogOut width={15} height={15} className="mr-3" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfile;
