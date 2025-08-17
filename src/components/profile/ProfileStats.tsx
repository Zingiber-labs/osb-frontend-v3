"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Database, Zap, Star, Trophy } from "lucide-react";

export type StatItem = {
  id: "cash" | "credits" | "points" | "wins";
  label: string;
  value: string | number;
};

const ICONS: Record<StatItem["id"], React.ReactNode> = {
  cash: <Database className="h-9 w-9 text-white" aria-hidden="true" />,
  credits: <Zap className="h-9 w-9 text-white" aria-hidden="true" />,
  points: <Star className="h-9 w-9 text-white" aria-hidden="true" />,
  wins: <Trophy className="h-9 w-9 text-white" aria-hidden="true" />,
};

export default function ProfileStats({ stats }: { stats: StatItem[] }) {
  return (
    <section className="relative text-white pb-4">
      <div className="flex items-center justify-between">
        <h3 className="text-cyan-300 uppercase tracking-[0.2em] font-bold">
          Your Earning
        </h3>

        <Button
          type="button"
          className="
            rounded-full h-8 px-4 text-[10px] uppercase tracking-widest
            bg-black/90 text-white hover:bg-black
            border border-white/10
          "
          variant="ghost"
        >
          Withdraw Funds
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.id} className="flex items-center gap-4">
            <div className="shrink-0">{ICONS[s.id]}</div>

            <div className="leading-tight">
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                {s.label}
              </div>
              <div className="text-3xl font-semibold">{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
