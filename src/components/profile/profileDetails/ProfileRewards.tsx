import { useProfileData } from "@/hooks/profile/useProfile";
import Image from "next/image";

const ProfileRewards = () => {
  const { data: profileData } = useProfileData();

  const xp = profileData?.balance?.xp ?? 0;
  const gems = profileData?.balance?.gems ?? 0;
  const coins = profileData?.balance?.coins ?? 0;

  return (
    <div className="rounded-lg py-6 px-4 bg-[#24282B] border border-primary-orange shadow-[0_0_10px_rgba(255,107,47,0.5)] flex flex-col items-center gap-6">
      {/* Rewards */}
      <div className="w-full space-y-3 px-4">
        <div className="flex justify-between text-white">
          <span className="text-gray-400">XP:</span>
          <div className="flex items-center gap-2">
            <span className="text-sm">{xp}</span>
          </div>
        </div>

        <div className="flex justify-between text-white">
          <span className="text-gray-400">Gems:</span>
          <div className="flex items-center gap-2">
            <Image src="/img/gem.svg" alt="Gem" width={14} height={14} />
            <span className="text-sm">{gems}</span>
          </div>
        </div>

        <div className="flex justify-between text-white">
          <span className="text-gray-400">Points:</span>
          <div className="flex items-center gap-2">
            <Image src="/img/coin.svg" alt="Coin" width={14} height={14} />
            <span className="text-sm">{coins}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileRewards;
