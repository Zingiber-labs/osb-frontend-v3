"use client";

import React from "react";
import ProfileSidebar, {
  ProfileSidebarProps,
} from "@/components/profile/ProfileSidebar";
import ProfileStats, { StatItem } from "@/components/profile/ProfileStats";
import ProfileRank, { RankRow, Option } from "@/components/profile/ProfileRank";

const ProfilePage = () => {

  const user: ProfileSidebarProps["user"] = {
    name: "Richard Stone",
    username: "@R.STONE44",
    status: "online",
    memberSince: "June 15, 2025",
    email: "richstone@example.com",
    socials: { facebook: "RichardStone", instagram: "richardStone90" },
    payments: [
      { type: "VISA", last4: "7812", expiry: "10/22", default: true },
      {
        type: "PayPal",
        name: "Richard Stone",
        email: "richardstone000@gmail.com",
      },
      { type: "Binance", id: "XXXX689", email: "richardstone000@gmail.com" },
      { type: "MASTERCARD", last4: "7812", expiry: "10/22", default: false },
    ],
    avatarUrl: "/img/user-example.jpg",
  };

  const stats: StatItem[] = [
    { id: "cash", label: "Cash Earned", value: "$1,909" },
    { id: "credits", label: "Credits", value: "123,009" },
    { id: "points", label: "Player Points", value: "400" },
    { id: "wins", label: "Win Games", value: "56" },
  ];

  const teamOpts: Option[] = [
    { value: "all", label: "All" },
    { value: "east", label: "East" },
    { value: "west", label: "West" },
  ];

  const posOpts: Option[] = [
    { value: "all", label: "All" },
    { value: "pg", label: "PG" },
    { value: "sg", label: "SG" },
    { value: "sf", label: "SF" },
    { value: "pf", label: "PF" },
    { value: "c", label: "C" },
  ];

  const scoreOpts: Option[] = [
    { value: "all", label: "All" },
    { value: "top10", label: "Top 10" },
    { value: "top25", label: "Top 25" },
    { value: "top50", label: "Top 50" },
  ];

  type RankRow = {
    team: string;
    freeThrows: number;
    twoPointers: number;
    threePointers: number;
  };

  const rankData: RankRow[] = [
    {
      team: "KAREEM ABDUL-JABBAR",
      freeThrows: 15.5,
      twoPointers: 82.5,
      threePointers: 38.0,
    },
    {
      team: "MICHAEL JORDAN",
      freeThrows: 16.2,
      twoPointers: 83.8,
      threePointers: 39.1,
    },
    {
      team: "LEBRON JAMES",
      freeThrows: 15.8,
      twoPointers: 84.1,
      threePointers: 37.9,
    },
    {
      team: "KOBE BRYANT",
      freeThrows: 15.3,
      twoPointers: 81.2,
      threePointers: 36.5,
    },
    {
      team: "TIM DUNCAN",
      freeThrows: 14.9,
      twoPointers: 79.7,
      threePointers: 35.4,
    },
    {
      team: "SHAQUILLE O'NEAL",
      freeThrows: 14.4,
      twoPointers: 78.0,
      threePointers: 34.2,
    },
    {
      team: "DIRK NOWITZKI",
      freeThrows: 14.7,
      twoPointers: 80.3,
      threePointers: 35.1,
    },
    {
      team: "STEPH CURRY",
      freeThrows: 16.5,
      twoPointers: 85.0,
      threePointers: 40.2,
    },
    {
      team: "KEVIN DURANT",
      freeThrows: 15.9,
      twoPointers: 82.9,
      threePointers: 38.4,
    },
    {
      team: "HAKEEM OLAJUWON",
      freeThrows: 15.2,
      twoPointers: 81.5,
      threePointers: 37.2,
    },
    {
      team: "RUSSELL WESTBROOK",
      freeThrows: 15.0,
      twoPointers: 80.0,
      threePointers: 36.8,
    },
    {
      team: "LARRY BIRD",
      freeThrows: 16.1,
      twoPointers: 83.2,
      threePointers: 39.6,
    },
    {
      team: "MAGIC JOHNSON",
      freeThrows: 15.4,
      twoPointers: 82.1,
      threePointers: 36.0,
    },
    {
      team: "GIANNIS ANTETOKOUNMPO",
      freeThrows: 14.8,
      twoPointers: 81.7,
      threePointers: 34.9,
    },
    {
      team: "KAWHI LEONARD",
      freeThrows: 15.7,
      twoPointers: 82.6,
      threePointers: 38.1,
    },
  ];

  return (
    <div className="pt-8 gap-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-13">

        <aside className="lg:col-span-3">
          <ProfileSidebar user={user} />
        </aside>

        <section className="lg:col-span-9 space-y-6">
          <ProfileStats stats={stats} />
          <ProfileRank
            data={rankData}
            options={{ team: teamOpts, position: posOpts, score: scoreOpts }}
            defaultSelections={{ team: "all", position: "all", score: "all" }}
          />
        </section>
        
      </div>
    </div>
  );
};

export default ProfilePage;
