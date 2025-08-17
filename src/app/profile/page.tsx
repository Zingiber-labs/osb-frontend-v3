"use client";

import React from "react";
import ProfileSidebar, {
  ProfileSidebarProps,
} from "@/components/profile/ProfileSidebar";
import ProfileStats, { StatItem } from "@/components/profile/ProfileStats";
import ProfileRank from "@/components/profile/ProfileRank";

const ProfilePage = () => {
  // ← Estos mocks luego vendrán del backend
  const user: ProfileSidebarProps["user"] = {
    name: "Richard Stone",
    username: "@R.STONE44",
    status: "online",
    memberSince: "June 15, 2025",
    email: "richstone@example.com",
    socials: { facebook: "RichardStone", instagram: "richardStone90" },
    payments: [
      { type: "VISA", last4: "7812", expiry: "10/22", default: true },
      { type: "PayPal", email: "richardstone000@gmail.com" },
      { type: "VISA", last4: "7812", expiry: "10/22" },
      { type: "ID", value: "XXXX689 richardstone000@gmail.com" },
    ],
    avatarUrl: "/img/user.png",
  };

  const stats: StatItem[] = [
    { id: "cash", label: "Cash Earned", value: "$1,909" },
    { id: "credits", label: "Credits", value: "123,009" },
    { id: "points", label: "Player Points", value: "400" },
    { id: "wins", label: "Win Games", value: "56" },
  ];

  return (
    <div className="pt-8 gap-8">
      {/* Contenedor y grid como en store */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-13">
        <aside className="lg:col-span-3">
          <ProfileSidebar user={user} />
        </aside>
        <section className="lg:col-span-9 space-y-6">
          <ProfileStats stats={stats} />
          <ProfileRank />
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
