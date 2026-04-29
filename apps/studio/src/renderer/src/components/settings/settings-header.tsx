import { IconArrowLeft, IconMoon, IconRefresh, IconSun } from "@tabler/icons-react";

import { useTheme } from "@/hooks/use-theme";

import { Button } from "../ui/button";

export function SettingsHeader({
  onBack,
  onRefresh,
}: {
  onBack: () => void;
  onRefresh: () => void;
}) {
  const { theme, toggle } = useTheme();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/70 px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <IconArrowLeft size={18} strokeWidth={1.5} />
        </Button>
        <div>
          <p className="text-[10px] font-light uppercase tracking-[0.18em] text-muted-foreground">
            Studio
          </p>
          <h1 className="text-base font-normal text-foreground/90">
            Agent settings
          </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          title={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? (
            <IconSun size={18} strokeWidth={1.5} aria-hidden />
          ) : (
            <IconMoon size={18} strokeWidth={1.5} aria-hidden />
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <IconRefresh size={15} strokeWidth={1.5} />
          Refresh
        </Button>
      </div>
    </header>
  );
}
