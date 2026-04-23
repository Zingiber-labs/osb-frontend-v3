import { getRewardIcon, rewardLabelMap } from "@/lib/event.utils";
import { CompetitiveReward } from "@/types/event";

type CompetitiveRewardsListProps = {
  rewards?: CompetitiveReward[];
};

export default function CompetitiveRewardsList({
  rewards,
}: CompetitiveRewardsListProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/15 p-4">
      <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
        Competitive rewards
      </div>

      {rewards?.length ? (
        <div className="space-y-2">
          {rewards.map((reward, index) => (
            <div
              key={`rank-${index}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3"
            >
              <div>
                <p className="font-bold text-white">
                  {reward.label ||
                    `Rank ${reward.rankFrom}${
                      reward.rankTo !== reward.rankFrom
                        ? ` - ${reward.rankTo}`
                        : ""
                    }`}
                </p>
                <p className="text-xs text-white/55">
                  Position {reward.rankFrom}
                  {reward.rankTo !== reward.rankFrom
                    ? ` to ${reward.rankTo}`
                    : ""}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white">
                {getRewardIcon(reward.code)}
                <span>
                  {reward.amount}{" "}
                  {rewardLabelMap[reward.code ?? ""] ?? reward.code ?? "Reward"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/60">
          Ranking is enabled, but there are no competitive rewards configured
          yet.
        </p>
      )}
    </div>
  );
}
