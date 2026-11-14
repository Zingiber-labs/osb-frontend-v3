import {
  CheckCircle2,
  CircleDashed,
  Coins,
  Gem,
  Lock,
  Star,
} from "lucide-react";

export const rewardLabelMap: Record<string, string> = {
  COINS: "Coins",
  GEMS: "Gems",
  XP: "XP",
};

export const getRewardIcon = (code?: string) => {
  switch (code) {
    case "COINS":
      return <Coins className="h-4 w-4" />;
    case "GEMS":
      return <Gem className="h-4 w-4" />;
    case "XP":
      return <Star className="h-4 w-4" />;
    default:
      return <Star className="h-4 w-4" />;
  }
};

export const formatDate = (value?: string) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDateTime = (value?: string) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const getMilestoneStatusStyles = (status?: string) => {
  switch (status) {
    case "AVAILABLE":
      return {
        label: "Available",
        icon: <CircleDashed className="h-4 w-4" />,
        className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
      };
    case "CLAIMED":
      return {
        label: "Claimed",
        icon: <CheckCircle2 className="h-4 w-4" />,
        className: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        icon: <CheckCircle2 className="h-4 w-4" />,
        className: "border-sky-400/30 bg-sky-500/10 text-sky-100",
      };
    case "LOCKED":
    default:
      return {
        label: "Locked",
        icon: <Lock className="h-4 w-4" />,
        className: "border-white/10 bg-white/5 text-white/80",
      };
  }
};
