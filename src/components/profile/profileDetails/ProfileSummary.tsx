import { Avatar, AvatarImage } from "@/components/ui/avatar";

export default function ProfileSummary() {
  return (
    <div className="rounded-lg py-6 px-4 bg-[#24282B] border border-primary-orange shadow-[0_0_10px_rgba(255,107,47,0.5)] flex flex-col items-center gap-6">
      <Avatar className="w-24 h-24 border-none">
        <AvatarImage src="/img/avatar.svg" alt="Avatar" />
      </Avatar>

      {/* Rank and Title */}
      <div className="flex items-center gap-3 px-4">
        {/* Golden emblem placeholder */}
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold text-white uppercase">COMMANDER</h2>
          <p className="text-sm text-gray-400 text-center">Rank #1</p>
        </div>
      </div>

      {/* Total Mission Points */}
      <div className="flex flex-col items-center gap-1 px-4">
        <p className="text-gray-400 text-center">Total Mission Points:</p>
        <p className="text-2xl font-bold text-white">1884 MP</p>
      </div>

      {/* Statistics */}
      <div className="w-full space-y-3 px-4">
        <div className="flex justify-between text-white">
          <span className="text-gray-400">Avg Score:</span>
          <span className="font-bold">3.39</span>
        </div>
        <div className="flex justify-between text-white">
          <span className="text-gray-400">Win Rate:</span>
          <span className="font-bold">70.8%</span>
        </div>
        <div className="flex justify-between text-white">
          <span className="text-gray-400">Top 4 Rate:</span>
          <span className="font-bold">23.4%</span>
        </div>
        <div className="flex justify-between text-white">
          <span className="text-gray-400">Favorite Ship:</span>
          <span className="font-bold">Stellarhawk</span>
        </div>
      </div>
    </div>
  );
}
