"use client";

import * as React from "react";

type GateOptions = {
  hasUnclaimedDailyReward?: boolean;
};

export function useDailyLoginRewardsGate({
  hasUnclaimedDailyReward,
}: GateOptions) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (hasUnclaimedDailyReward) {
      setOpen(true);
    }
  }, [hasUnclaimedDailyReward]);

  return { open, setOpen };
}
