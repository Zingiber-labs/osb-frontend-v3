"use client";

import * as React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

function formatDate(date?: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US");
}

function formatPrerequisites(value: MissionDetails["mission"]["prerequisites"]) {
  if (!value) return "None";
  if (Array.isArray(value)) return value.join(", ");
  return value;
}

function formatRequirements(requirements?: Record<string, number>) {
  if (!requirements) return [];
  return Object.entries(requirements).filter(([, value]) => value !== null && value !== undefined);
}

export default function MissionDetailsDialog({
  open,
  onOpenChange,
  mission,
  onReplay,
}: Props) {
  if (!mission) return null;

  const requirements = formatRequirements(mission.mission.requirements);
  const isSuccess = mission.isCompleted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-[95vw] sm:max-w-3xl
          border border-primary-orange/60
          bg-[#101820]
          p-0
          text-white
          shadow-[0_0_20px_rgba(255,140,64,0.2)]
        "
      >
        <div className="rounded-xl border border-secondary-cyan/50 bg-[linear-gradient(180deg,#101820_0%,#0c141b_100%)] p-4 sm:p-6">
          <DialogHeader className="mb-4 border border-primary-orange/60 bg-[#17212A] px-4 py-3 shadow-[0_0_12px_rgba(255,140,64,0.18)]">
            <DialogTitle className="text-left text-xl font-bold uppercase tracking-wide sm:text-3xl">
              Mission Details: {mission.mission.name}
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-2xl border border-primary-orange/60 bg-[#0A141C] p-3 sm:p-5 shadow-[0_0_12px_rgba(255,140,64,0.18)]">
            {/* tabs mock */}
            <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">
              <div className="rounded-xl border border-primary-orange bg-[#1B1E22] px-3 py-2 text-center text-sm font-bold uppercase shadow-[0_0_10px_rgba(255,140,64,0.25)] sm:text-lg">
                General
              </div>
              <div className="rounded-xl border border-secondary-cyan/70 bg-[#111A22] px-3 py-2 text-center text-sm font-bold uppercase shadow-[0_0_10px_rgba(59,231,255,0.15)] sm:text-lg">
                Requirements
              </div>
              <div className="rounded-xl border border-secondary-cyan/70 bg-[#111A22] px-3 py-2 text-center text-sm font-bold uppercase shadow-[0_0_10px_rgba(59,231,255,0.15)] sm:text-lg">
                Rewards
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
              {/* left */}
              <div className="space-y-2 text-sm sm:text-base">
                <InfoRow label="Mission Name" value={mission.mission.name} valueClass="text-primary-orange" />
                <InfoRow label="Description" value={mission.mission.description} />
                <InfoRow label="Author" value={mission.mission.author} valueClass="text-primary-orange" />

                <InfoRow
                  label="Mission Progress"
                  value={
                    mission.progress?.current !== undefined && mission.progress?.target !== undefined
                      ? `${mission.progress.current}/${mission.progress.target}`
                      : "N/A"
                  }
                  valueClass="text-primary-orange"
                />

                <div>
                  <p className="font-semibold text-white">Objectives</p>
                  <ul className="mt-1 list-disc pl-5 text-white/90">
                    {requirements.length > 0 ? (
                      requirements.map(([key, value]) => (
                        <li key={key}>
                          <span className="capitalize">{key}</span>:{" "}
                          <span className="text-primary-orange">{value}</span>
                        </li>
                      ))
                    ) : (
                      <li>N/A</li>
                    )}
                  </ul>
                </div>

                <InfoRow
                  label="Result"
                  value={isSuccess ? "SUCCESS" : "FAILURE"}
                  valueClass={isSuccess ? "text-[#70E37C]" : "text-primary-orange"}
                />

                <InfoRow
                  label="Min Players"
                  value={`${mission.mission.minPlayers}${mission.mission.maxPlayers ? `/${mission.mission.maxPlayers}` : ""}`}
                  valueClass="text-primary-orange"
                />

                <InfoRow
                  label="Max Players"
                  value={mission.mission.maxPlayers ? String(mission.mission.maxPlayers) : "N/A"}
                  valueClass="text-primary-orange"
                />

                <InfoRow
                  label="Pre-Requirements"
                  value={formatPrerequisites(mission.mission.prerequisites)}
                  valueClass="text-primary-orange"
                />
              </div>

              {/* right */}
              <div className="space-y-3 text-sm sm:text-base">
                <div>
                  <p className="font-semibold text-white">Pre-Requiriments:</p>
                  <p className="mt-1 whitespace-pre-line text-primary-orange">
                    {formatPrerequisites(mission.mission.prerequisites)}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-white">Rewards:</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-[#70E37C]">+{mission.mission.rewards?.xp ?? 0} XP</p>
                    {!!mission.mission.rewards?.coins && (
                      <p className="text-[#70E37C]">+{mission.mission.rewards.coins} Coins</p>
                    )}
                    {!!mission.mission.rewards?.gems && (
                      <p className="text-[#70E37C]">+{mission.mission.rewards.gems} Gems</p>
                    )}
                  </div>
                </div>

                <InfoRow
                  label="Reward Status"
                  value={mission.isClaimed ? "Claimed" : "Pending"}
                  valueClass={mission.isClaimed ? "text-[#70E37C]" : "text-primary-orange"}
                />

                <InfoRow
                  label="Cool-down Timer"
                  value={
                    mission.mission.cooldownMinutes
                      ? `${mission.mission.cooldownMinutes} mins`
                      : "N/A"
                  }
                  valueClass="text-primary-orange"
                />

                <InfoRow
                  label="Repeatable"
                  value={mission.mission.isRepeatable ? "Yes" : "No"}
                  valueClass={mission.mission.isRepeatable ? "text-[#70E37C]" : "text-primary-orange"}
                />

                <InfoRow
                  label="Date Accepted"
                  value={formatDate(mission.createdAt)}
                  valueClass="text-primary-orange"
                />

                <div className="pt-2">
                  <Image
                    src="/img/ship.webp"
                    alt="Ship"
                    width={120}
                    height={80}
                    className="h-auto w-[90px] object-contain sm:w-[120px]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6">
              <Button
                type="button"
                onClick={() => onReplay?.(mission)}
                className="
                  h-12 rounded-xl border border-secondary-cyan/70
                  bg-[#111A22] text-base font-bold uppercase text-white
                  shadow-[0_0_10px_rgba(59,231,255,0.2)]
                  hover:bg-[#16232d]
                "
              >
                Replay Mission
              </Button>

              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="
                  h-12 rounded-xl border border-secondary-cyan/70
                  bg-[#111A22] text-base font-bold uppercase text-white
                  shadow-[0_0_10px_rgba(59,231,255,0.2)]
                  hover:bg-[#16232d]
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

function InfoRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <p className="leading-relaxed">
      <span className="font-semibold text-white">{label}: </span>
      <span className={valueClass ?? "text-white/90"}>{value}</span>
    </p>
  );
}