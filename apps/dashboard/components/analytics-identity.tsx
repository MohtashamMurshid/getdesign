"use client";

import { useEffect } from "react";
import { getAnalytics } from "@getdesign/analytics";

export function AnalyticsIdentity({ userId }: { userId: string }) {
  useEffect(() => {
    const analytics = getAnalytics("dashboard");
    const identify = () => analytics.identify(userId);
    const unsubscribe = analytics.subscribe(identify);
    void analytics.sync().then(identify);
    return unsubscribe;
  }, [userId]);
  return null;
}
