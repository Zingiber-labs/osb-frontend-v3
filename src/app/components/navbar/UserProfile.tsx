import React from "react";
import Image from "next/image";

interface UserProfileProps {
  name: string;
  avatar?: string;
  className?: string;
  onClick?: () => void;
}

const UserProfile = (props: UserProfileProps) => {
  const {
    name,
    avatar = "/img/user-example.jpg",
    className = "",
    onClick,
  } = props;
  return (
    <div
      className={`flex items-center space-x-3 group cursor-pointer hover:bg-white/10 transition-colors rounded-full px-3 py-1.5 ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Perfil de usuario"
    >
      <div className="relative w-10 h-10 rounded-full overflow-hidden">
        <Image
          src={avatar}
          alt={`Avatar de ${name}`}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <span className="text-white font-medium hidden sm:inline-block">
        {name}
      </span>
    </div>
  );
};

export default UserProfile;
