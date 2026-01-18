"use client";

import ProfileStatsTabs from "@/components/profile/ProfileTabs";

const ProfilePage = () => {
  return (
    <div className="pt-8 gap-8">
      {/* <div className="grid grid-cols-1 gap-6 lg:grid-cols-13"> */}
        {/* <aside className="lg:col-span-3">
          <ProfileSidebar user={user} />
        </aside> */}

        <section className="lg:col-span-9 space-y-6">
         <ProfileStatsTabs />
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
