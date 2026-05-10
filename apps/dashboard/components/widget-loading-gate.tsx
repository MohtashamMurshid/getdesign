"use client";

import { useIsFetching } from "@tanstack/react-query";

import { DashboardLoader } from "@/components/dashboard-loader";

export function WidgetLoadingGate({ children }: { children: React.ReactNode }) {
  const isFetching = useIsFetching();
  const loading = isFetching > 0;

  return (
    <>
      {loading ? <DashboardLoader /> : null}
      <div style={{ display: loading ? "none" : "contents" }}>{children}</div>
    </>
  );
}
