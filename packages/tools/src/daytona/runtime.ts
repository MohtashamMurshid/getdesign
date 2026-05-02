import type { Daytona } from "@daytonaio/sdk";

/**
 * Versioned identifier for the getdesign capture runtime image.
 * Bump this whenever `infra/daytona/Dockerfile` changes in a way that
 * affects rendering or screenshot output. Each version produces a new
 * immutable per-user Daytona snapshot, so old runs stay reproducible.
 */
export const CAPTURE_RUNTIME_VERSION = "2026-05-02-a";

/**
 * Public, pinned OCI image that backs every user's reusable Daytona snapshot.
 *
 * The image is published to GHCR by the getdesign maintainers from
 * `infra/daytona/Dockerfile` and pinned by digest so each user's Daytona
 * account imports the exact same runtime. The default below is a placeholder
 * until the first published digest lands; in real environments,
 * `GETDESIGN_CAPTURE_RUNTIME_IMAGE` overrides it.
 */
const DEFAULT_CAPTURE_RUNTIME_IMAGE =
  "ghcr.io/mohtashammurshid/getdesign-capture:placeholder";

export function getCaptureRuntimeImage(): string {
  const fromEnv = process.env.GETDESIGN_CAPTURE_RUNTIME_IMAGE?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_CAPTURE_RUNTIME_IMAGE;
}

export function captureSnapshotName(
  version: string = CAPTURE_RUNTIME_VERSION,
): string {
  if (!version.trim()) {
    throw new Error("captureSnapshotName: version must not be empty.");
  }
  return `getdesign-capture-${version.trim()}`;
}

export type CaptureRuntimeStatus =
  | "ready"
  | "provisioning"
  | "failed";

export type EnsureCaptureSnapshotOptions = {
  /**
   * Override the snapshot name. Defaults to the current
   * `captureSnapshotName(CAPTURE_RUNTIME_VERSION)`.
   */
  snapshotName?: string;
  /**
   * Override the public OCI image used to seed the snapshot. Defaults to the
   * env-resolved capture runtime image.
   */
  image?: string;
  /**
   * Optional resources to request when creating a new snapshot. Daytona
   * defaults are 1 vCPU / 1 GiB RAM / 3 GiB disk; the capture runtime needs
   * more headroom for Chromium.
   */
  resources?: {
    cpu?: number;
    memory?: number;
    disk?: number;
  };
  /**
   * Maximum time to wait for the snapshot to reach the `active` state.
   * Defaults to 5 minutes (300 seconds). Snapshot pulls and validation can
   * take a couple of minutes the first time a user provisions.
   */
  waitForActiveSeconds?: number;
  /**
   * Optional callback for snapshot build/pull logs streamed by Daytona.
   */
  onLogs?: (chunk: string) => void;
  /**
   * Status callback used to report `provisioning`/`ready`/`failed` while
   * the operation runs. Useful to surface first-run delays in API/CLI output.
   */
  onStatus?: (event: {
    status: CaptureRuntimeStatus;
    snapshotName: string;
    message?: string;
  }) => void;
};

export type EnsureCaptureSnapshotResult = {
  status: CaptureRuntimeStatus;
  snapshotName: string;
  version: string;
  image: string;
  /**
   * `true` when this call created the snapshot. `false` when an existing
   * active snapshot was reused.
   */
  created: boolean;
  reason?: string;
};

/**
 * Minimum Daytona sandbox resources required for full landing page capture.
 * 2 vCPU, 4 GiB memory, 5 GiB disk. Set on the user's snapshot at create
 * time and not exposed as a per-run override in v1. Bump the runtime version
 * if this changes so old runs stay reproducible.
 */
export const CAPTURE_RUNTIME_RESOURCES = {
  cpu: 2,
  memory: 4,
  disk: 5,
} as const;

const DEFAULT_RESOURCES = CAPTURE_RUNTIME_RESOURCES;
const DEFAULT_WAIT_SECONDS = 300;
const POLL_INTERVAL_MS = 2_000;
const TERMINAL_FAILURE_STATES = new Set(["error", "build_failed"]);

function isMissingSnapshotError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    response?: { status?: number };
    message?: unknown;
    statusCode?: number;
  };
  if (candidate.response?.status === 404) return true;
  if (candidate.statusCode === 404) return true;
  const message =
    typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
  return message.includes("not found");
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ensures a getdesign capture snapshot exists in the user's Daytona account
 * for the current runtime version. If the snapshot is missing, it is created
 * from the pinned public image; if it already exists in an `active` state,
 * the call is a no-op. The call resolves once the snapshot is usable for
 * sandbox creation, or rejects with an actionable error if provisioning
 * cannot complete (e.g. quota, build failure, timeout).
 */
export async function ensureDaytonaCaptureSnapshot(
  client: Daytona,
  options: EnsureCaptureSnapshotOptions = {},
): Promise<EnsureCaptureSnapshotResult> {
  const snapshotName = options.snapshotName ?? captureSnapshotName();
  const image = options.image ?? getCaptureRuntimeImage();
  const waitSeconds = options.waitForActiveSeconds ?? DEFAULT_WAIT_SECONDS;

  options.onStatus?.({
    status: "provisioning",
    snapshotName,
    message: `Checking for existing capture snapshot ${snapshotName}.`,
  });

  let existing: Awaited<ReturnType<typeof client.snapshot.get>> | null = null;
  try {
    existing = await client.snapshot.get(snapshotName);
  } catch (error) {
    if (!isMissingSnapshotError(error)) {
      const reason = error instanceof Error ? error.message : String(error);
      options.onStatus?.({ status: "failed", snapshotName, message: reason });
      return {
        status: "failed",
        snapshotName,
        version: CAPTURE_RUNTIME_VERSION,
        image,
        created: false,
        reason,
      };
    }
  }

  if (existing && existing.state === "active") {
    options.onStatus?.({
      status: "ready",
      snapshotName,
      message: `Reusing active capture snapshot ${snapshotName}.`,
    });
    return {
      status: "ready",
      snapshotName,
      version: CAPTURE_RUNTIME_VERSION,
      image,
      created: false,
    };
  }

  if (existing && TERMINAL_FAILURE_STATES.has(String(existing.state))) {
    const reason = `Snapshot ${snapshotName} is in terminal state '${existing.state}'. Delete it from the Daytona Dashboard and retry.`;
    options.onStatus?.({ status: "failed", snapshotName, message: reason });
    return {
      status: "failed",
      snapshotName,
      version: CAPTURE_RUNTIME_VERSION,
      image,
      created: false,
      reason,
    };
  }

  let created = false;

  if (!existing) {
    options.onStatus?.({
      status: "provisioning",
      snapshotName,
      message: `Creating capture snapshot ${snapshotName} from ${image}.`,
    });

    try {
      await client.snapshot.create(
        {
          name: snapshotName,
          image,
          resources: {
            cpu: options.resources?.cpu ?? DEFAULT_RESOURCES.cpu,
            memory: options.resources?.memory ?? DEFAULT_RESOURCES.memory,
            disk: options.resources?.disk ?? DEFAULT_RESOURCES.disk,
          },
        },
        { onLogs: options.onLogs, timeout: waitSeconds },
      );
      created = true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      options.onStatus?.({ status: "failed", snapshotName, message: reason });
      return {
        status: "failed",
        snapshotName,
        version: CAPTURE_RUNTIME_VERSION,
        image,
        created: false,
        reason,
      };
    }
  }

  const deadline = Date.now() + waitSeconds * 1_000;
  while (Date.now() < deadline) {
    let snapshot;
    try {
      snapshot = await client.snapshot.get(snapshotName);
    } catch (error) {
      if (!isMissingSnapshotError(error)) {
        const reason = error instanceof Error ? error.message : String(error);
        options.onStatus?.({ status: "failed", snapshotName, message: reason });
        return {
          status: "failed",
          snapshotName,
          version: CAPTURE_RUNTIME_VERSION,
          image,
          created,
          reason,
        };
      }
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    if (snapshot.state === "active") {
      options.onStatus?.({
        status: "ready",
        snapshotName,
        message: `Capture snapshot ${snapshotName} is active.`,
      });
      return {
        status: "ready",
        snapshotName,
        version: CAPTURE_RUNTIME_VERSION,
        image,
        created,
      };
    }

    if (TERMINAL_FAILURE_STATES.has(String(snapshot.state))) {
      const reason = `Snapshot ${snapshotName} entered terminal state '${snapshot.state}'${
        snapshot.errorReason ? `: ${snapshot.errorReason}` : ""
      }`;
      options.onStatus?.({ status: "failed", snapshotName, message: reason });
      return {
        status: "failed",
        snapshotName,
        version: CAPTURE_RUNTIME_VERSION,
        image,
        created,
        reason,
      };
    }

    await sleep(POLL_INTERVAL_MS);
  }

  const timeoutReason = `Snapshot ${snapshotName} did not become active within ${waitSeconds}s.`;
  options.onStatus?.({ status: "failed", snapshotName, message: timeoutReason });
  return {
    status: "failed",
    snapshotName,
    version: CAPTURE_RUNTIME_VERSION,
    image,
    created,
    reason: timeoutReason,
  };
}
