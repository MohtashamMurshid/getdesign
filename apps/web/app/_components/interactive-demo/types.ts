import type { ReactNode } from "react";

export type Site = {
  id: string;
  url: string;
  favicon: string;
  theme: string;
  palette: string[];
  fonts: [string, string];
  sections: string[];
};

export type Step = {
  kind: "call" | "ok" | "info" | "err";
  label: ReactNode;
};

export type Surface = "web" | "api" | "cli" | "sdk" | "skill";
