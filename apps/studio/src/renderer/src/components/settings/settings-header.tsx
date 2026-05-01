import { useEffect } from "react";
import { IconMoon, IconRefresh, IconSun } from "@tabler/icons-react";

import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";

export function SettingsHeader({
  darwinTrafficLightInset = false,
  onBack,
  onRefresh,
}: {
  darwinTrafficLightInset?: boolean;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  return (
    <header
      className={cn(
        "relative flex h-11 shrink-0 items-center justify-end gap-3 border-b border-border/70 px-3",
        darwinTrafficLightInset && "pl-[76px]",
      )}
    >
      <h1 className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 truncate text-sm font-normal text-foreground/90">
        Settings
      </h1>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          title={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? (
            <IconSun size={16} strokeWidth={1.5} aria-hidden />
          ) : (
            <IconMoon size={16} strokeWidth={1.5} aria-hidden />
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <IconRefresh size={15} strokeWidth={1.5} />
          Refresh
        </Button>
        <Button
          
          size="sm"
          onClick={onBack}
          title="Close settings (Esc)"
        >
          Done
        </Button>
      </div>
    </header>
  );
}
