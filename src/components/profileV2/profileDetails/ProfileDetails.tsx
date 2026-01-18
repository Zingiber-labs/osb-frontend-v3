import ProfileSummary from "./ProfileSummary";
import MissionHistory from "./MissionHistory";
import RecentMissions from "./RecentMissions";

export default function ProfileDetails() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 max-w-7xl mx-auto">
      <div className="lg:col-span-3">
        <ProfileSummary />
      </div>
      <div className="lg:col-span-9 space-y-6">
        <MissionHistory />
        <RecentMissions />
      </div>
    </div>
  );
}
