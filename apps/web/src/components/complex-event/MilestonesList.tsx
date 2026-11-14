import {
  getMilestoneStatusStyles,
  getRewardIcon,
  rewardLabelMap,
} from "@/lib/event.utils";
import { MilestoneItem } from "@/types/event";

type MilestonesListProps = {
  milestones?: MilestoneItem[];
  eventId: string | number;
};

export default function MilestonesList({
  milestones,
  eventId,
}: MilestonesListProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/15 p-4">
      <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
        Milestones
      </div>

      {milestones?.length ? (
        <div className="space-y-3">
          {milestones.map((milestone) => {
            const statusUI = getMilestoneStatusStyles(milestone.status);

            return (
              <div
                key={`${eventId}-${milestone.step}`}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-white">
                      Phase {milestone.step}
                    </p>
                    <p className="text-xs text-white/65">
                      Target: {milestone.conditionValue}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusUI.className}`}
                  >
                    {statusUI.icon}
                    {statusUI.label}
                  </span>
                </div>

                <div className="mt-3">
                  {milestone.rewards?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {milestone.rewards.map((reward, index) => (
                        <div
                          key={`${milestone.step}-${reward.code}-${index}`}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white"
                        >
                          {getRewardIcon(reward.code)}
                          <span>
                            {reward.amount}{" "}
                            {rewardLabelMap[reward.code ?? ""] ??
                              reward.code ??
                              "Reward"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/55">
                      No rewards configured for this milestone.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-white/60">No milestones available.</p>
      )}
    </div>
  );
}
