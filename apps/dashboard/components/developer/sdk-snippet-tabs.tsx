"use client";

import { useState } from "react";
import {
  buildSdkGetDesignSnippet,
  buildSdkStreamSnippet,
} from "@getdesign/content";

import { CopyCommand } from "@/components/developer/copy-command";
import { cn } from "@/lib/utils";

type Tab = "getDesign" | "streamDesign";

const EXAMPLE_SITE = "https://linear.app";

export function SdkSnippetTabs() {
  const [tab, setTab] = useState<Tab>("getDesign");

  const snippet =
    tab === "getDesign"
      ? buildSdkGetDesignSnippet(EXAMPLE_SITE)
      : buildSdkStreamSnippet(EXAMPLE_SITE);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {(
          [
            ["getDesign", "getDesign"],
            ["streamDesign", "streamDesign"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors",
              tab === id
                ? "border-foreground/20 bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <CopyCommand label="TypeScript" command={snippet} />
    </div>
  );
}
