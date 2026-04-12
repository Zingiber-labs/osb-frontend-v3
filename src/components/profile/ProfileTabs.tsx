"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  CalendarDays,
  Cpu,
  DoorOpen,
  Medal,
  Trophy,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import LockerRoom from "./locker/LockerRoom";
import MyEvents from "./profileDetails/my-events/MyEvents";
import ProfileDetails from "./profileDetails/ProfileDetails";
import ProfileStats from "./tabs/ProfileStats";

type TabValue =
  | "profile"
  | "my-events"
  | "stats"
  | "trophies"
  | "medals"
  | "tech"
  | "locker";

export type StatRow = {
  id: number;
  label: string;
  value: string | number;
};

type ProfileStatsTabsProps = {
  defaultTab?: TabValue;
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

const validTabs: TabValue[] = [
  "profile",
  "my-events",
  "stats",
  "trophies",
  "medals",
  "tech",
  "locker",
];

export default function ProfileTabs({
  defaultTab = "profile",
  title = "PROFILE",
}: ProfileStatsTabsProps) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  const initialTab: TabValue =
    tabFromUrl && validTabs.includes(tabFromUrl as TabValue)
      ? (tabFromUrl as TabValue)
      : defaultTab;

  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  useEffect(() => {
    const nextTab =
      tabFromUrl && validTabs.includes(tabFromUrl as TabValue)
        ? (tabFromUrl as TabValue)
        : defaultTab;

    setActiveTab(nextTab);
  }, [tabFromUrl, defaultTab]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as TabValue)}
      className="w-full"
    >
      <div>
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

            <TabsTrigger value="my-events" className="shrink-0 tab-trigger h-9">
              <TabLabel icon={CalendarDays} label="MY EVENTS" />
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

      <Card className="rounded-lg border border-primary bg-primary/35 text-white">
        <TabsContent value="stats" className="p-3 pt-4">
          <ProfileStats title={title} />
        </TabsContent>

        <TabsContent value="profile" className="p-3 pt-4">
          <ProfileDetails />
        </TabsContent>

        <TabsContent value="my-events" className="p-3 pt-4">
          <MyEvents />
        </TabsContent>

        <TabsContent value="locker" className="p-3 pt-4">
          <LockerRoom />
        </TabsContent>

        {["trophies", "medals", "tech"].map((t) => (
          <TabsContent key={t} value={t} className="p-3 pt-4">
            <div className="rounded-lg border border-primary/50 bg-primary/20 p-6 text-white/90">
              {t} content…
            </div>
          </TabsContent>
        ))}
      </Card>
    </Tabs>
  );
}
