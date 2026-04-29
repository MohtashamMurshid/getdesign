import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";

import { Button } from "../ui/button";

export function SettingsHeader({
  onBack,
  onRefresh,
}: {
  onBack: () => void;
  onRefresh: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
            <IconArrowLeft size={18} strokeWidth={1.5} />
          </Button>
          <div>
            <p className="text-[10px] font-light uppercase tracking-[0.18em] text-muted-foreground">
              Studio
            </p>
            <h1 className="text-base font-normal">Agent settings</h1>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <IconRefresh size={15} strokeWidth={1.5} />
          Refresh
        </Button>
      </div>
    </header>
  );
}
