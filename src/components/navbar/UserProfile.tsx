"use client";

import { useProfileData } from "@/hooks/profile/useProfile";
import { Loader2, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
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
  const { data: session, status } = useSession();
  const { data: profileData, isLoading } = useProfileData();

  const profile = profileData;
  const coins = profile?.balance?.coins ?? 0;
  const gems = profile?.balance?.gems ?? 0;
  const xp = profile?.balance?.xp ?? 0;

  const isAuthenticated = status === "authenticated";

  if (status === "loading") return <p>Loading...</p>;

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

  const user = session?.user as any;

  const mockAvatar = "/img/avatar.svg";

  const displayName =
    profile?.username || user?.name || user?.email?.split("@")?.[0] || "User";

  const avatarSrc = profile?.avatar || mockAvatar;

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div
      className={[
        className,
        "inline-flex items-center gap-2 sm:gap-4 rounded-full border border-orange-500/80 bg-black/40",
        "px-3 py-2 sm:px-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md",
        "max-w-full",
      ].join(" ")}
    >
      <div className="hidden sm:flex items-center gap-4">
        <div className="flex items-center justify-center gap-2 select-none">
          <span className="text-sm font-semibold tracking-wide text-white flex items-center">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white/70" />
            ) : (
              `${xp} XP`
            )}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 select-none">
          <Image
            src="/img/coin.svg"
            alt="Coin"
            width={15}
            height={15}
            className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] animate-bob"
          />
          <span className="text-sm font-semibold tracking-wide text-white flex items-center">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white/70" />
            ) : (
              coins
            )}
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 select-none">
          <Image
            src="/img/gem.svg"
            alt="Gem"
            width={20}
            height={20}
            className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] animate-bob"
          />
          <span className="text-sm font-semibold tracking-wide text-white flex items-center">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white/70" />
            ) : (
              gems
            )}
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 sm:gap-3 focus:outline-none cursor-pointer max-w-[70vw] sm:max-w-none"
          >
            <span className="hidden sm:inline text-sm font-semibold tracking-[0.18em] uppercase text-white truncate">
              {displayName}
            </span>

            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-orange-500/80 shadow-[0_0_12px_rgba(0,0,0,0.7)]">
              <AvatarImage src={avatarSrc} alt={displayName} />
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" forceMount className="min-w-60">
          <DropdownMenuLabel className="font-normal">
            <div
              className="flex gap-3 items-center cursor-pointer"
              onClick={() => router.push(href)}
              role="button"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarSrc} alt={displayName} />
              </Avatar>

              <div className="min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {displayName}
                </p>
                {user?.email && (
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                )}
              </div>
            </div>
          </DropdownMenuLabel>

          <div className="sm:hidden px-2 pb-2">
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">{xp} XP</span>
              </div>
              <div className="flex items-center gap-2">
                <Image src="/img/coin.svg" alt="Coin" width={14} height={14} />
                <span className="text-sm">{coins}</span>
              </div>
              <div className="flex items-center gap-2">
                <Image src="/img/gem.svg" alt="Gem" width={14} height={14} />
                <span className="text-sm">{gems}</span>
              </div>
            </div>
          </div>

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
