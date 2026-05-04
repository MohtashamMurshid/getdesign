import type { WebContents } from "electron";

export function waitForWebContentsVisualReady(
  webContents: WebContents,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const ceiling = setTimeout(finish, timeoutMs);
    const ready = () => {
      webContents
        .executeJavaScript(
          `(async () => {
            try { if (document.fonts && document.fonts.ready) { await document.fonts.ready; } } catch (_) {}
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            return true;
          })()`,
        )
        .then(() => {
          clearTimeout(ceiling);
          finish();
        })
        .catch(() => {
          clearTimeout(ceiling);
          finish();
        });
    };
    if (webContents.isLoading()) {
      webContents.once("did-finish-load", ready);
      webContents.once("did-fail-load", () => {
        clearTimeout(ceiling);
        finish();
      });
    } else {
      ready();
    }
  });
}
