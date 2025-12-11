type MissionDetailsCardProps = {
  title: string;
  missionId: string;
  author: string;
  description: string;
  requirements: any;
  rewards: any;
};

const MissionDetailsCard = ({
  title,
  missionId,
  author,
  description,
  requirements,
  rewards,
}: MissionDetailsCardProps) => {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-[22px]
        border border-[#ffb86b]
        bg-[radial-gradient(circle_at_top,_#8d3a08_0%,_#4b1a02_45%,_#260c01_100%)]
        px-5 py-4
        text-[11px] sm:text-[13px]
        shadow-[0_0_0_1px_rgba(255,184,107,0.7),0_0_26px_rgba(248,171,90,0.9)]
      "
    >
      <div className="pointer-events-none absolute right-3 top-3 bottom-3 w-[7px] rounded-full bg-cyan-400/90" />

      <div className="flex items-start justify-between gap-4 pr-6">
        <div>
          <h2 className="text-[16px] sm:text-[18px] font-bold text-white">
            {title}
          </h2>
          <p className="text-[11px] text-slate-200">by {author}</p>
        </div>
        <p className="mt-[2px] text-[11px] text-slate-100">
          <span className="font-semibold">Mission ID:</span> {missionId}
        </p>
      </div>

      <div className="mt-3 space-y-1 pr-6">
        <p className="font-semibold uppercase text-[11px] text-[#ffb86b]">
          Description:
        </p>
        <p className="leading-snug">{description}</p>
      </div>

      <div className="mt-4 grid gap-8 pr-10 sm:grid-cols-[1.1fr_1.2fr_1fr]">
        {/* COLUMN 1 */}
        <div>
          <p className="font-semibold uppercase text-[11px] text-[#ffb86b]">
            Requirements to access the mission:
          </p>
          <p className="mt-[2px]">XP Level: ---</p>
          <p>Days on OSB: ---</p>
          <p>Players: ---</p>
        </div>

        {/* COLUMN 2 */}
        <div>
          <p className="font-semibold uppercase text-[11px] text-[#ffb86b]">
            Requirements to approve the mission:
          </p>
          <p className="mt-[2px]">Points: {requirements.points}</p>
          <p>Rebounds: ---</p>
          <p>FT: ---</p>
        </div>

        {/* COLUMN 3 */}
        <div>
          <p className="font-semibold uppercase text-[11px] text-[#ffb86b]">
            Rewards:
          </p>
          <p className="mt-[2px]">XP: {rewards.xp}</p>
          <p>Coins: ---</p>
          <p>Gems: {rewards.gems}</p>
        </div>
      </div>
    </div>
  );
};

export default MissionDetailsCard;
