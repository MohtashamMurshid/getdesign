import type { DesignProgressEvent } from "@getdesign/sdk";
import spinners from "unicode-animations";
import type { Spinner } from "unicode-animations";

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function elapsedSeconds(start: number, now: () => number): string {
  return `${((now() - start) / 1000).toFixed(1)}s`;
}

export function summarizeDesignEvent(event: DesignProgressEvent): string {
  if (event.phase === "crawl") {
    return event.status === "start"
      ? "crawl: reading site"
      : `crawl: ${event.stylesheets ?? 0} stylesheets from ${event.siteName ?? "site"}`;
  }

  if (event.phase === "capture") {
    return `capture.${event.capturePhase}: ${event.status}${
      event.detail ? ` — ${event.detail}` : ""
    }${event.durationMs ? ` (${event.durationMs}ms)` : ""}`;
  }

  if (event.phase === "visual") {
    return event.status === "start" ? "visual: capturing page" : `visual: ${event.visualStatus}`;
  }

  if (event.phase === "describe") {
    return `describe: ${event.status}${event.detail ? ` — ${event.detail}` : ""}`;
  }

  if (event.phase === "extract") {
    return event.status === "start"
      ? "extract: deriving tokens"
      : `extract: ${event.fontFamilies ?? 0} font families`;
  }

  if (event.phase === "synthesize") {
    return event.status === "start"
      ? "synthesize: drafting design.md"
      : `synthesize: doc validated (${event.paletteGroups ?? 0} palette groups)`;
  }

  if (event.phase === "render") {
    return event.status === "start"
      ? "render: formatting markdown"
      : `render: ${event.markdownLength ?? 0} chars`;
  }

  return "run: working";
}

function isActiveEvent(event: DesignProgressEvent): boolean {
  return event.status === "start";
}

function logProgressLine(event: DesignProgressEvent, start: number, now: () => number): void {
  console.error(`${DIM}[${elapsedSeconds(start, now)}] ${summarizeDesignEvent(event)}${RESET}`);
}

/**
 * Timed phase lines to stderr plus an optional TTY spinner on active steps.
 * Keeps human-facing progress in one place (locality for CLI UX).
 */
export class ProgressDisplay {
  private readonly enabled: boolean;
  private readonly spinner: Spinner = spinners.braille;
  private frame = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private message = "";

  constructor(
    private readonly start: number,
    private readonly now: () => number = Date.now,
    isTTY: boolean = Boolean(process.stderr.isTTY),
  ) {
    this.enabled = isTTY;
  }

  event(event: DesignProgressEvent): void {
    this.clearLiveLine();
    logProgressLine(event, this.start, this.now);

    if (!this.enabled) return;
    if (isActiveEvent(event)) {
      this.message = summarizeDesignEvent(event);
      this.startLiveLine();
    } else {
      this.stopLiveLine();
    }
  }

  stop(): void {
    this.clearLiveLine();
    this.stopLiveLine();
  }

  private startLiveLine(): void {
    if (this.timer) return;
    this.renderLiveLine();
    this.timer = setInterval(() => this.renderLiveLine(), this.spinner.interval);
  }

  private stopLiveLine(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }

  private renderLiveLine(): void {
    const frame = this.spinner.frames[this.frame % this.spinner.frames.length] ?? "";
    this.frame += 1;
    process.stderr.write(
      `\r${DIM}${frame} [${elapsedSeconds(this.start, this.now)}] ${this.message}${RESET}`,
    );
  }

  private clearLiveLine(): void {
    if (!this.enabled) return;
    process.stderr.write("\r\x1b[2K");
  }
}
