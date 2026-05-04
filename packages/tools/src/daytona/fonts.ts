import type { Sandbox } from "@daytonaio/sdk";

import type { CapturePhaseHandler } from "./types.js";

const I18N_TLDS = new Set([
  ".cn",
  ".jp",
  ".kr",
  ".tw",
  ".hk",
  ".ru",
  ".il",
  ".sa",
  ".ae",
  ".in",
]);

/**
 * TLD-driven heuristic for whether a URL likely needs CJK / RTL / non-Latin
 * glyph coverage beyond Daytona's default Latin-only font set.
 */
export function shouldInstallI18nFonts(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (!host) return false;

  // Non-ASCII hostnames (IDN) almost always need broader glyph coverage.
  if (/[^\x00-\x7f]/.test(host)) return true;

  // Punycode-encoded IDN (xn--…) — same story.
  if (host.split(".").some((label) => label.startsWith("xn--"))) return true;

  for (const tld of I18N_TLDS) {
    if (host.endsWith(tld)) return true;
  }
  return false;
}

export type EnsureI18nFontsOptions = {
  onPhase?: CapturePhaseHandler;
};

/**
 * Install Noto CJK + emoji fonts inside the sandbox if they aren't already
 * present. Idempotent; expected to add ~30s on first call per sandbox.
 */
export async function ensureI18nFonts(
  sandbox: Sandbox,
  options: EnsureI18nFontsOptions = {},
): Promise<void> {
  const { onPhase } = options;
  onPhase?.({ phase: "fonts", status: "start" });
  const startedAt = Date.now();

  try {
    const probe = await sandbox.process.executeCommand(
      "fc-list :lang=zh | wc -l",
    );
    const count = Number((probe.result ?? "0").trim());
    if (Number.isFinite(count) && count > 0) {
      onPhase?.({
        phase: "fonts",
        status: "ok",
        detail: "already installed",
        durationMs: Date.now() - startedAt,
      });
      return;
    }
  } catch {
    // fall through and install
  }

  const command =
    "DEBIAN_FRONTEND=noninteractive sudo -n apt-get update -qq && DEBIAN_FRONTEND=noninteractive sudo -n apt-get install -y -qq fonts-noto-cjk fonts-noto-color-emoji && fc-cache -f >/dev/null";
  const res = await sandbox.process.executeCommand(command, undefined, undefined, 240);
  if (res.exitCode !== 0) {
    onPhase?.({
      phase: "fonts",
      status: "warn",
      detail: `apt install failed: ${(res.result ?? "").trim().slice(0, 200)}`,
      durationMs: Date.now() - startedAt,
    });
    return;
  }
  onPhase?.({
    phase: "fonts",
    status: "ok",
    detail: "installed Noto CJK + emoji",
    durationMs: Date.now() - startedAt,
  });
}
