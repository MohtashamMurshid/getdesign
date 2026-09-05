import type { ProviderKeyMeta } from "../../app/(dashboard)/account/provider-keys-card";

// This fixture never contacts WorkOS, Convex, Daytona, or OpenAI.
export const fixture = {
  keys: [] as ProviderKeyMeta[],
  populated: false,
  failSave: false,
  markdown:
    "# Fixture design system\n\n## 1. Visual Theme & Atmosphere\n\nA local test design.\n\nAccent: `#3366FF`",
};

export function refresh() {
  window.dispatchEvent(new Event("fixture-refresh"));
}

export function navigate(path: string) {
  window.history.pushState({}, "", path);
  refresh();
}
