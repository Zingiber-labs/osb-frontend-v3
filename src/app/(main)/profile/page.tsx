"use client";

import ProfileStatsTabs from "@/components/profile/ProfileTabs";

type TabValue =
  | "profile"
  | "my-events"
  | "stats"
  | "trophies"
  | "medals"
  | "tech"
  | "locker";

const validTabs: TabValue[] = [
  "profile",
  "my-events",
  "stats",
  "trophies",
  "medals",
  "tech",
  "locker",
];

const ProfilePage = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) => {
  const params = await searchParams;
  const tab =
    params.tab && validTabs.includes(params.tab as TabValue)
      ? (params.tab as TabValue)
      : "profile";
  return (
    <div className="pt-8 gap-8">
      {/* <div className="grid grid-cols-1 gap-6 lg:grid-cols-13"> */}
      {/* <aside className="lg:col-span-3">
          <ProfileSidebar user={user} />
        </aside> */}

      <section className="lg:col-span-9 space-y-6">
        <ProfileStatsTabs defaultTab={tab} />
        {/* <ProfileStats stats={stats} />
          <ProfileRank
            data={rankData}
            options={{ team: teamOpts, position: posOpts, score: scoreOpts }}
            defaultSelections={{ team: "all", position: "all", score: "all" }}
          /> */}
      </section>
    </div>
    // </div>
  );
};

export default ProfilePage;
