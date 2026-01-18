"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Bell, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage } from "../ui/avatar";
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

const UserProfile = ({
  className = "",
  href = "/profile",
}: UserProfileProps) => {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const mockCoins = 125;
  const mockAvatar = "/img/user-example.jpg";

  const displayName =
    isAuthenticated && (user?.username || user?.email?.split("@")[0]);

  const avatarSrc =
    (isAuthenticated && (user?.avatar || mockAvatar)) || mockAvatar;

  const coins = mockCoins;

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className={`${className} text-sm font-semibold uppercase tracking-[0.18em] text-white hover:text-orange-400 transition-colors`}
      >
        Login
      </Link>
    );
  }

  return (
    <div
      className={`${className} inline-flex items-center gap-4 rounded-full border border-orange-500/80 bg-black/40 px-6 py-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md relative`}
    >
      <div className="flex items-center justify-center gap-2 select-none">
        <Image
          src="/img/coin.svg"
          alt="Ball animation"
          width={15}
          height={15}
          className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] animate-bob"
        />
        <span className="text-sm font-semibold tracking-wide text-white">
          {coins}
        </span>
      </div>

      <div className="flex items-center text-white">
        <Bell className="h-4 w-4" />
      </div>

      {/* Dropdown username + avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 focus:outline-none cursor-pointer">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase text-white">
              {displayName}
            </span>
            <Avatar className="h-10 w-10 border-2 border-orange-500/80 shadow-[0_0_12px_rgba(0,0,0,0.7)]">
              <AvatarImage src={avatarSrc} alt={displayName} />
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div
              className="flex gap-4 items-center cursor-pointer"
              onClick={() => router.push(href)}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarSrc} alt={displayName} />
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">
                  {displayName}
                </p>
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
