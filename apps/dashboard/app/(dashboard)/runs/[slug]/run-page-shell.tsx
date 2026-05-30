"use client";

import { useCallback, useState, type ReactNode } from "react";
import { LayoutGroup } from "motion/react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { RunState } from "@/lib/runs-store";

import { ExportActions } from "./export-actions";
import { GalleryPanel } from "./gallery-panel";
import { RunProgress } from "./run-progress";
import type { LightboxTile } from "./tile-lightbox";

/**
 * Client wrapper for the run detail page. Owns the active-tile focus state
 * (so the describe stage can highlight a tile in the gallery panel) and
 * hosts the Motion `LayoutGroup` that lets capture-stage previews fly into
 * the gallery's slots via shared `layoutId`.
 *
 * Layout: a flex row where the left column is the page header + content,
 * and the right column is a sticky gallery panel.
 */
export function RunPageShell({
  runId,
  userId,
  initialTiles,
  totalExpected,
  exportMarkdown,
  markdownContent,
  runState,
}: {
  runId: string;
  userId: string;
  initialTiles: LightboxTile[];
  totalExpected?: number;
  /** Markdown source string used by the export-actions toolbar. */
  exportMarkdown: string | null;
  /** Server-rendered markdown article for completed runs. */
  markdownContent: ReactNode | null;
  /** Run state for in-progress / failed runs. */
  runState: RunState | null;
}) {
  const [focusTileIndex, setFocusTileIndex] = useState<number>(-1);
  const handleActiveTileChange = useCallback((index: number) => {
    setFocusTileIndex(index);
  }, []);

  return (
    <LayoutGroup id={`run-${runId}`}>
      <div className="flex min-h-svh flex-1 items-stretch">
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Overview</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{runId}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            {exportMarkdown ? (
              <div className="ml-auto flex items-center gap-1">
                <ExportActions
                  content={exportMarkdown}
                  filename={`${runId}.md`}
                />
              </div>
            ) : null}
          </header>

          {markdownContent
            ? markdownContent
            : runState
              ? (
                <RunProgress
                  initialRun={runState}
                  userId={userId}
                  onActiveTileChange={handleActiveTileChange}
                />
              )
              : null}
        </div>

        <GalleryPanel
          runId={runId}
          userId={userId}
          initialTiles={initialTiles}
          totalExpected={totalExpected}
          highlightIndex={focusTileIndex}
        />
      </div>
    </LayoutGroup>
  );
}
