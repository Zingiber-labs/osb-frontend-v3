"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import * as React from "react";

type MissionDetails = {
  id: string;
  missionId: string;
  mission: {
    name: string;
    description: string;
    author: string;
    minPlayers: number;
    maxPlayers: number | null;
    requirements?: Record<string, number>;
    prerequisites?: string[] | string | null;
    rewards?: {
      xp?: number;
      coins?: number;
      gems?: number;
    };
    isRepeatable?: boolean;
    cooldownMinutes?: number | null;
  };
  progress?: {
    current?: number;
    target?: number;
  };
  isCompleted: boolean;
  isClaimed: boolean;
  completedAt: string | null;
  createdAt: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mission: MissionDetails | null;
  onReplay?: (mission: MissionDetails) => void;
};

type TabKey = "general" | "requirements" | "rewards";

function formatDate(date?: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US");
}

function formatPrerequisites(
  value: MissionDetails["mission"]["prerequisites"],
) {
  if (!value) return "None";
  if (Array.isArray(value)) return value.join(", ");
  return value;
}

function formatRequirements(requirements?: Record<string, number>) {
  if (!requirements) return [];
  return Object.entries(requirements).filter(
    ([, value]) => value !== null && value !== undefined,
  );
}

function prettifyRequirementKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (s) => s.toUpperCase());
}

export default function MissionDetailsDialog({
  open,
  onOpenChange,
  mission,
  onReplay,
}: Props) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("general");

  React.useEffect(() => {
    if (open) setActiveTab("general");
  }, [open]);

  if (!mission) return null;

  const requirements = formatRequirements(mission.mission.requirements);
  const isSuccess = mission.isCompleted;

  const progressValue =
    mission.progress?.current !== undefined &&
    mission.progress?.target !== undefined
      ? `${mission.progress.current}/${mission.progress.target}`
      : "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="
          max-w-none
          border border-primary-orange/50
          bg-[#07141A]
          p-0
          text-white
          shadow-[0_0_25px_rgba(255,140,64,0.18)]
        "
      >
        <div className="rounded-[24px] border border-secondary-cyan/25 bg-[linear-gradient(180deg,#0a1a21_0%,#071118_100%)] p-4 sm:p-5">
          <DialogHeader className="mb-4">
            <div className="rounded-[14px] border border-primary-orange/45 bg-[#102028] px-4 py-3">
              <DialogTitle className="text-left text-lg font-extrabold uppercase tracking-wide text-white sm:text-2xl">
                Mission Details: {mission.mission.name}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="rounded-3xl border border-primary-orange/45 bg-[#08161d] p-4 sm:p-5">
            <div className="mb-4 grid grid-cols-3 gap-3">
              <TabButton
                active={activeTab === "general"}
                onClick={() => setActiveTab("general")}
              >
                General
              </TabButton>
              <TabButton
                active={activeTab === "requirements"}
                onClick={() => setActiveTab("requirements")}
              >
                Requirements
              </TabButton>
              <TabButton
                active={activeTab === "rewards"}
                onClick={() => setActiveTab("rewards")}
              >
                Rewards
              </TabButton>
            </div>

            <div className="min-h-[300px] rounded-[16px] bg-[#071118] px-4 py-4 sm:px-5 sm:py-5">
              {activeTab === "general" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <InfoRow
                      label="Mission Name"
                      value={mission.mission.name}
                    />
                    <InfoRow
                      label="Author"
                      value={mission.mission.author || "N/A"}
                    />
                    <InfoRow
                      label="Description"
                      value={mission.mission.description || "N/A"}
                    />
                    <InfoRow label="Mission Progress" value={progressValue} />
                    <InfoRow
                      label="Objectives"
                      value={
                        requirements.length
                          ? requirements
                              .map(
                                ([key, value]) =>
                                  `${prettifyRequirementKey(key)}: ${value}`,
                              )
                              .join(", ")
                          : "N/A"
                      }
                    />
                    <InfoRow
                      label="Result"
                      value={isSuccess ? "Success" : "Failed"}
                    />
                  </div>

                  <div className="space-y-4">
                    <InfoRow
                      label="Cool-down timer"
                      value={
                        mission.mission.cooldownMinutes
                          ? `${mission.mission.cooldownMinutes} mins`
                          : "N/A"
                      }
                    />
                    <InfoRow
                      label="Repeatable"
                      value={mission.mission.isRepeatable ? "Yes" : "No"}
                    />
                    <InfoRow
                      label="Date Accepted"
                      value={formatDate(mission.createdAt)}
                    />
                    <InfoRow
                      label="Reward Status"
                      value={mission.isClaimed ? "Claimed" : "Pending"}
                    />
                  </div>
                </div>
              )}

              {activeTab === "requirements" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-orange sm:text-base">
                      To Access The Mission
                    </p>

                    <div className="space-y-3">
                      <InfoRow
                        label="Min Players"
                        value={String(mission.mission.minPlayers)}
                      />
                      <InfoRow
                        label="Max Players"
                        value={
                          mission.mission.maxPlayers
                            ? String(mission.mission.maxPlayers)
                            : "N/A"
                        }
                      />
                      <InfoRow
                        label="Players"
                        value={`${mission.mission.minPlayers}/${
                          mission.mission.maxPlayers ?? "N/A"
                        }`}
                      />
                      <InfoRow
                        label="Pre-requirements"
                        value={formatPrerequisites(
                          mission.mission.prerequisites,
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-orange sm:text-base">
                      To Approve The Mission
                    </p>

                    <div className="space-y-3">
                      {requirements.length > 0 ? (
                        requirements.map(([key, value]) => (
                          <InfoRow
                            key={key}
                            label={prettifyRequirementKey(key)}
                            value={String(value)}
                          />
                        ))
                      ) : (
                        <InfoRow label="Requirements" value="N/A" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "rewards" && (
                <div className="grid grid-cols-1 gap-6 pt-2 text-center sm:grid-cols-3">
                  <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-secondary-cyan/20 bg-[#09171d] px-4 py-8">
                    <div className="text-lg font-bold uppercase tracking-wide text-white/80">
                      XP
                    </div>
                    <div className="text-xl font-extrabold sm:text-xl text-[#57d6f6]">
                      +{mission.mission.rewards?.xp ?? 0} xp
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-secondary-cyan/20 bg-[#09171d] px-4 py-8">
                    <div className="text-lg font-bold uppercase tracking-wide text-white/80">
                      <Image
                        src="/img/coin.svg"
                        alt="Coin"
                        width={44}
                        height={44}
                      />
                    </div>
                    <div className="text-xl font-extrabold sm:text-xl text-[#f7c85a]">
                      {`${mission.mission.rewards?.coins ?? 0} coins`}
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-secondary-cyan/20 bg-[#09171d] px-4 py-8">
                    <div className="text-lg font-bold uppercase tracking-wide text-white/80">
                      <Image
                        src="/img/gem.svg"
                        alt="Gem"
                        width={44}
                        height={44}
                      />
                    </div>
                    <div className="text-xl font-extrabold sm:text-xl text-[#f58bd7]">
                      {`${mission.mission.rewards?.gems ?? 0} gems`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <Button
                type="button"
                onClick={() => onReplay?.(mission)}
                disabled={!onReplay}
                className="
                  h-11 rounded-[14px]
                  border border-secondary-cyan/60
                  bg-[#10212a]
                  text-sm font-extrabold uppercase tracking-wide text-white
                  shadow-[0_0_12px_rgba(59,231,255,0.14)]
                  hover:bg-[#142a35]
                  disabled:opacity-50
                  sm:h-12 sm:text-base
                "
              >
                Replay Mission
              </Button>

              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="
                  h-11 rounded-[14px]
                  border border-secondary-cyan/60
                  bg-[#10212a]
                  text-sm font-extrabold uppercase tracking-wide text-white
                  shadow-[0_0_12px_rgba(59,231,255,0.14)]
                  hover:bg-[#142a35]
                  sm:h-12 sm:text-base
                "
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-12 rounded-[16px] border text-center text-sm font-extrabold uppercase tracking-wide transition-all sm:text-base",
        active
          ? "border-primary-orange bg-[#221812] text-[#f5c57f] shadow-[0_0_12px_rgba(255,140,64,0.18)]"
          : "border-secondary-cyan/55 bg-[#0d1d25] text-white shadow-[0_0_10px_rgba(59,231,255,0.08)] hover:bg-[#11242d]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm leading-7 text-white sm:text-base">
      <span className="font-semibold text-white">{label}: </span>
      <span className="text-white/90">{value}</span>
    </p>
  );
}
