"use client";

import { WorkOsWidgets } from "@workos-inc/widgets";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function WorkOsWidgetsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WorkOsWidgets
      theme={{
        appearance: mounted && resolvedTheme === "dark" ? "dark" : "light",
        accentColor: "gray",
        radius: "medium",
      }}
    >
      {children}
    </WorkOsWidgets>
  );
}
