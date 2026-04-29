import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "studio-theme";

export type StudioTheme = "light" | "dark";

function readStoredTheme(): StudioTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyThemeClass(theme: StudioTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(STORAGE_KEY, theme);
}

export function useTheme() {
  const [theme, setTheme] = useState<StudioTheme>(() => readStoredTheme());

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, toggle };
}
