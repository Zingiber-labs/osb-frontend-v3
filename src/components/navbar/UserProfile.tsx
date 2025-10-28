"use client";

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
  className?: string;
  href?: string;
}

const UserProfile = ({ className = "", href = "/profile" }: UserProfileProps) => {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const displayName = isAuthenticated
    ? user?.username || user?.email?.split("@")[0] || "User"
    : "Login";

  const avatarSrc =
    user?.avatar ||
    (isAuthenticated ? "/img/user-example.jpg" : "/img/guest-avatar.png");

  return (
    <div className={`${className} flex items-center gap-4`}>
      <div className="flex gap-3 items-center">
        <Link
          href={isAuthenticated ? href : "/login"}
          className="block text-sm text-white hover:text-primary hover:underline transition-colors"
        >
          {displayName}
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
              <AvatarImage src={avatarSrc} alt={displayName} />
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div
              className="flex gap-4 items-center cursor-pointer"
              onClick={() => router.push("/profile")}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarSrc} alt={displayName} />
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">{displayName}</p>
                {user?.email && (
                  <p className="text-xs text-gray-400 truncate max-w-[150px]">
                    {user.email}
                  </p>
                )}
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
