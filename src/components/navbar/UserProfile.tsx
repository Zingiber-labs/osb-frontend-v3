import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface UserProfileProps {
  name: string;
  avatar?: string;
  className?: string;
  href: string;
}

const UserProfile = (props: UserProfileProps) => {
  const {
    name,
    avatar = "/img/user-example.jpg",
    className = "",
    href,
  } = props;
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
        <Link href={"/login"} className="block text-sm text-white">
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
            <div className="flex gap-4">
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
