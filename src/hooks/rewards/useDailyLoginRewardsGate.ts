"use client";

import * as React from "react";

type GateOptions = {
  userId?: string | number | null;
  storageKeyPrefix?: string;
  showOncePerDay?: boolean;
};

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useDailyLoginRewardsGate({
  userId,
  storageKeyPrefix = "daily-login-rewards",
  showOncePerDay = true,
}: GateOptions) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;

    const key = `${storageKeyPrefix}:${userId}`;
    const lastShown = localStorage.getItem(key);

    if (!showOncePerDay) {
      setOpen(true);
      return;
    }

    if (lastShown !== todayKey()) {
      setOpen(true);
      localStorage.setItem(key, todayKey());
    }
  }, [userId, showOncePerDay, storageKeyPrefix]);

  return { open, setOpen };
}
