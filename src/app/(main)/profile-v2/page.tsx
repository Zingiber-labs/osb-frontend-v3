"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileDetails from "@/components/profileV2/profileDetails/ProfileDetails";

export default function ProfileV2Page() {
  return (
    <div className="pt-8">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">PROFILE</TabsTrigger>
          <TabsTrigger value="stats">STATS</TabsTrigger>
          <TabsTrigger value="trophies">TROPHIES</TabsTrigger>
          <TabsTrigger value="medals">MEDALS</TabsTrigger>
          <TabsTrigger value="tech">TECH</TabsTrigger>
          <TabsTrigger value="locker-room">LOCKER ROOM</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileDetails />
        </TabsContent>
        <TabsContent value="stats">
          <h2>Stats</h2>
        </TabsContent>
        <TabsContent value="trophies">
          <h2>Trophies</h2>
        </TabsContent>
        <TabsContent value="medals">
          <h2>Medals</h2>
        </TabsContent>
        <TabsContent value="tech">
          <h2>Tech</h2>
        </TabsContent>
        <TabsContent value="locker-room">
          <h2>Locker Room</h2>
        </TabsContent>
      </Tabs>
    </div>
  );
}
