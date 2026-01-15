"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Cpu, DoorOpen, Medal, Trophy, User } from "lucide-react";
import * as React from "react";
import ProfileStats from "./tabs/ProfileStats";

export type StatRow = {
  id: number;
  label: string;
  value: string | number;
};

type ProfileStatsTabsProps = {
  defaultTab?: "profile" | "stats" | "trophies" | "medals" | "tech" | "locker";
  title?: string;
};

function TabLabel({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

export default function ProfileTabs({
  defaultTab = "stats",
  title = "STATS",
}: ProfileStatsTabsProps) {
  return (
    <Card className="rounded-lg border border-primary bg-primary/35 text-white">
      <Tabs defaultValue={defaultTab} className="w-full">
        {/* ---------- TABS HEADER ---------- */}
        <div className="px-3 pt-3">
          <div className="w-full overflow-x-auto">
            <TabsList
              className="
                inline-flex w-max min-w-full gap-2
                rounded-lg bg-primary/30 border border-primary/40
                p-2
              "
            >
              <TabsTrigger value="profile" className="shrink-0 tab-trigger h-9">
                <TabLabel icon={User} label="PROFILE" />
              </TabsTrigger>

              <TabsTrigger value="stats" className="shrink-0 tab-trigger h-9">
                <TabLabel icon={BarChart3} label="STATS" />
              </TabsTrigger>

              <TabsTrigger value="trophies" className="shrink-0 tab-trigger h-9">
                <TabLabel icon={Trophy} label="TROPHIES" />
              </TabsTrigger>

              <TabsTrigger value="medals" className="shrink-0 tab-trigger h-9">
                <TabLabel icon={Medal} label="MEDALS" />
              </TabsTrigger>

              <TabsTrigger value="tech" className="shrink-0 tab-trigger h-9">
                <TabLabel icon={Cpu} label="TECH" />
              </TabsTrigger>

              <TabsTrigger value="locker" className="shrink-0 tab-trigger h-9">
                <TabLabel icon={DoorOpen} label="LOCKER ROOM" />
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* ---------- STATS CONTENT ---------- */}
        <TabsContent value="stats" className="p-3 pt-4">
          <ProfileStats title={title} />
        </TabsContent>

        {/* ---------- OTHER TABS ---------- */}
        {["profile", "trophies", "medals", "tech", "locker"].map((t) => (
          <TabsContent key={t} value={t} className="p-3 pt-4">
            <div className="rounded-lg border border-primary/50 bg-primary/20 p-6 text-white/90">
              {t} content…
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
