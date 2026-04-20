import { Daytona, type CreateSandboxFromSnapshotParams, type Sandbox, type ScreenshotOptions } from "@daytonaio/sdk";
import sharp from "sharp";

const DEFAULT_SNAPSHOT_NAME = "getdesign-latest";
const DEFAULT_TIMEOUT_SECONDS = 90;
const DEFAULT_CHROMIUM_FLAGS = [
  "--kiosk",
  "--no-first-run",
  "--hide-crash-restore-bubble",
  "--disable-session-crashed-bubble",
  "--no-default-browser-check",
];

export type DaytonaClientOptions = ConstructorParameters<typeof Daytona>[0];

export type SpawnSandboxOptions = {
  snapshot?: string;
  timeoutSeconds?: number;
  envVars?: Record<string, string>;
  labels?: Record<string, string>;
};

export type OpenUrlOptions = {
  timeoutSeconds?: number;
  chromiumBinary?: string;
  display?: string;
  extraFlags?: string[];
  env?: Record<string, string>;
};

export type ScreenshotArtifact = {
  imageBase64: string;
  width?: number;
  height?: number;
  format?: string;
  sizeBytes?: number;
};

export type FullPageTile = ScreenshotArtifact & {
  offsetY: number;
};

export type FullPageScreenshotOptions = {
  capture: () => Promise<ScreenshotArtifact>;
  scroll: (step: number) => Promise<void>;
  steps: number;
  scrollStepPx: number;
};

type DaytonaScreenshotResponse = {
  image?: string;
  imageBase64?: string;
  data?: string;
  width?: number;
  height?: number;
  format?: string;
  size_bytes?: number;
  sizeBytes?: number;
};

function assertNonEmptyText(value: string, label: string): void {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty.`);
  }
}

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function normalizeScreenshotResponse(
  response: DaytonaScreenshotResponse,
): ScreenshotArtifact {
  const imageBase64 =
    response.imageBase64 ?? response.image ?? response.data;

  if (!imageBase64) {
    throw new Error("Daytona screenshot response did not contain image data.");
  }

  return {
    imageBase64,
    width: response.width,
    height: response.height,
    format: response.format,
    sizeBytes: response.sizeBytes ?? response.size_bytes,
  };
}

export function createDaytonaClient(
  options?: DaytonaClientOptions,
): Daytona {
  return new Daytona(options);
}

export async function daytonaSpawn(
  client: Daytona,
  options: SpawnSandboxOptions = {},
): Promise<Sandbox> {
  const params: CreateSandboxFromSnapshotParams = {
    snapshot: options.snapshot ?? DEFAULT_SNAPSHOT_NAME,
    envVars: options.envVars,
    labels: options.labels,
  };

  const sandbox = await client.create(params, {
    timeout: options.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS,
  });

  await sandbox.computerUse.start();

  return sandbox;
}

export async function daytonaOpenUrl(
  sandbox: Sandbox,
  url: string,
  options: OpenUrlOptions = {},
): Promise<void> {
  const command = daytonaOpenUrlCommand(url, options);

  const response = await sandbox.process.executeCommand(
    command,
    undefined,
    options.env,
    options.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS,
  );

  if (response.exitCode !== 0) {
    throw new Error(
      `Failed to open URL in Daytona sandbox: ${response.result.trim() || "unknown error"}`,
    );
  }
}

export async function daytonaScreenshotViewport(
  sandbox: Sandbox,
  options: ScreenshotOptions = {},
): Promise<ScreenshotArtifact> {
  const response = (await sandbox.computerUse.screenshot.takeCompressed({
    format: options.format ?? "png",
    quality: options.quality,
    scale: options.scale,
    showCursor: options.showCursor ?? false,
  })) as DaytonaScreenshotResponse;

  return normalizeScreenshotResponse(response);
}

export async function daytonaScreenshotFullPage(
  options: FullPageScreenshotOptions,
): Promise<ScreenshotArtifact> {
  if (!Number.isInteger(options.steps) || options.steps <= 0) {
    throw new Error("Full-page screenshot steps must be a positive integer.");
  }

  if (!Number.isFinite(options.scrollStepPx) || options.scrollStepPx <= 0) {
    throw new Error("Full-page screenshot scrollStepPx must be greater than zero.");
  }

  const tiles: FullPageTile[] = [];

  for (let index = 0; index < options.steps; index += 1) {
    const tile = await options.capture();
    tiles.push({
      ...tile,
      offsetY: index * options.scrollStepPx,
    });

    if (index < options.steps - 1) {
      await options.scroll(options.scrollStepPx);
    }
  }

  const firstTile = tiles[0];

  if (!firstTile) {
    throw new Error("Expected at least one full-page screenshot tile.");
  }

  const preparedTiles = await Promise.all(
    tiles.map(async (tile) => {
      const buffer = Buffer.from(tile.imageBase64, "base64");
      const metadata = await sharp(buffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error("Unable to determine screenshot tile dimensions.");
      }

      return {
        ...tile,
        buffer,
        width: metadata.width,
        height: metadata.height,
      };
    }),
  );

  const width = firstTile.width ?? preparedTiles[0]?.width;
  if (!width) {
    throw new Error("Unable to determine screenshot tile width.");
  }

  for (const tile of preparedTiles) {
    if (tile.width !== width) {
      throw new Error("Full-page screenshot tiles must all share the same width.");
    }
  }

  const dedupedTiles = preparedTiles.filter((tile, index, allTiles) => (
    index === 0 || tile.imageBase64 !== allTiles[index - 1]?.imageBase64
  ));

  const totalHeight = Math.max(
    ...dedupedTiles.map((tile) => tile.offsetY + tile.height),
  );
  const compositeInput = dedupedTiles.map((tile) => ({
    input: tile.buffer,
    top: tile.offsetY,
    left: 0,
  }));

  const stitched = await sharp({
    create: {
      width,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(compositeInput)
    .png()
    .toBuffer();

  return {
    imageBase64: stitched.toString("base64"),
    width,
    height: totalHeight,
    format: "png",
    sizeBytes: stitched.byteLength,
  };
}

export async function daytonaStop(sandbox: Sandbox): Promise<void> {
  await sandbox.delete();
}

export function getDefaultSnapshotName(): string {
  return DEFAULT_SNAPSHOT_NAME;
}

export function designSnapshotName(commitSha: string): string {
  assertNonEmptyText(commitSha, "commitSha");
  return `getdesign-${commitSha.trim()}`;
}

export function buildSnapshotTag(commitSha: string): string {
  return designSnapshotName(commitSha);
}

export function daytonaOpenUrlCommand(
  url: string,
  options: OpenUrlOptions = {},
): string {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  }

  const chromiumBinary = options.chromiumBinary ?? "chromium";
  const display = options.display ?? ":1";
  const flags = [...DEFAULT_CHROMIUM_FLAGS, ...(options.extraFlags ?? [])];
  const quotedUrl = shellSingleQuote(parsed.toString());

  return [
    `DISPLAY=${shellSingleQuote(display)}`,
    shellSingleQuote(chromiumBinary),
    ...flags.map(shellSingleQuote),
    quotedUrl,
  ].join(" ");
}
