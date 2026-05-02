/**
 * Host-side Chrome DevTools Protocol client for the getdesign capture pipeline.
 *
 * Architecture:
 * - The capture-runtime image's `getdesign-chromium` wrapper binds CDP to
 *   `127.0.0.1:9222` inside the Daytona sandbox (no public exposure).
 * - This module opens an SSH tunnel through the Daytona TS SDK from the host
 *   agent process to the sandbox, forwarding remote `127.0.0.1:9222` to an
 *   ephemeral local port, then talks CDP over that tunnel.
 * - CDP is the *control* surface (measurement, scroll-to-pixel, overlay
 *   cleanup, fixed-element dedup). Screenshots stay on Daytona's
 *   `sandbox.computerUse.screenshot.takeCompressed()` — see ADR 0003.
 *
 * Tunnel implementation status: the Daytona SDK exposes `createSshAccess()`
 * which returns an `sshCommand` string + token, but does not provide a
 * programmatic port-forward primitive. Until we wire that to a real
 * `ssh -L`/SSH library subprocess, the tunnel layer is a documented stub
 * (see `TODO(cdp-tunnel)` below). The CDP wire protocol layer (JSON
 * discovery + WebSocket client) is fully implemented and unit tested so
 * the rest of the capture pipeline can land on top.
 */
import type { Sandbox } from "@daytonaio/sdk";

export type CdpTransport = {
  /**
   * Send a CDP frame and resolve with the typed `result` (or reject with
   * the CDP error). Implementations should match request `id`s to responses.
   */
  send: <T = unknown>(method: string, params?: Record<string, unknown>) => Promise<T>;
  close: () => Promise<void>;
};

export type CdpClient = {
  /**
   * Wraps `Runtime.evaluate`. Returns the deserialized JS value.
   */
  evaluate: <T = unknown>(expression: string) => Promise<T>;
  /**
   * Wraps `Runtime.evaluate` with `window.scrollTo(0, y)`.
   */
  scrollTo: (y: number) => Promise<void>;
  /**
   * Returns `Math.max(document.documentElement.scrollHeight, ...)` so callers
   * can drive precise tile capture.
   */
  documentHeight: () => Promise<number>;
  /**
   * Injects a `<style>` tag into the active document via `Runtime.evaluate`.
   * Used for overlay cleanup and fixed-element dedup CSS overrides.
   */
  addStyleTag: (css: string) => Promise<void>;
  /**
   * Closes the underlying WebSocket and tears down any host-side tunnel.
   */
  close: () => Promise<void>;
};

export type OpenCdpClientOptions = {
  /**
   * Optional override of the host-side discovery URL. Defaults to
   * `http://127.0.0.1:<localTunnelPort>`. Pass when the tunnel is opened
   * out-of-band (tests, future host-side ssh forwarder).
   */
  discoveryBaseUrl?: string;
  /**
   * Optional override of the WebSocket constructor. Used by tests to inject
   * a fake socket without touching the network.
   */
  webSocketCtor?: new (url: string) => WebSocketLike;
  /**
   * Optional fetch implementation. Defaults to global `fetch`.
   */
  fetchImpl?: typeof fetch;
  /**
   * Optional override that supplies the `webSocketDebuggerUrl` of the active
   * page target. Useful in tests when no real Chromium is reachable.
   */
  resolveTargetUrl?: () => Promise<string>;
};

export type WebSocketLike = {
  readyState: number;
  onopen: ((this: unknown, ev: unknown) => unknown) | null;
  onmessage: ((this: unknown, ev: { data: string | ArrayBuffer }) => unknown) | null;
  onerror: ((this: unknown, ev: unknown) => unknown) | null;
  onclose: ((this: unknown, ev: unknown) => unknown) | null;
  send: (data: string) => void;
  close: () => void;
};

const WS_OPEN = 1;

class JsonRpcCdpTransport implements CdpTransport {
  private nextId = 1;
  private readonly pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >();
  private readonly readyPromise: Promise<void>;
  private readonly socket: WebSocketLike;

  constructor(socket: WebSocketLike) {
    this.socket = socket;

    this.readyPromise = new Promise<void>((resolve, reject) => {
      if (socket.readyState === WS_OPEN) {
        resolve();
        return;
      }
      socket.onopen = () => resolve();
      socket.onerror = (event) =>
        reject(new Error(`CDP WebSocket error: ${describe(event)}`));
    });

    socket.onmessage = (event) => {
      let payload: unknown;
      try {
        const data =
          typeof event.data === "string"
            ? event.data
            : new TextDecoder().decode(event.data as ArrayBuffer);
        payload = JSON.parse(data);
      } catch {
        return;
      }

      if (!payload || typeof payload !== "object") return;
      const message = payload as {
        id?: number;
        error?: { message?: string };
        result?: unknown;
      };
      if (typeof message.id !== "number") return;

      const handler = this.pending.get(message.id);
      if (!handler) return;
      this.pending.delete(message.id);

      if (message.error) {
        handler.reject(new Error(message.error.message ?? "CDP error"));
      } else {
        handler.resolve(message.result);
      }
    };
  }

  async send<T = unknown>(
    method: string,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    await this.readyPromise;

    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async close(): Promise<void> {
    for (const handler of this.pending.values()) {
      handler.reject(new Error("CDP transport closed before response."));
    }
    this.pending.clear();
    try {
      this.socket.close();
    } catch {
      // best-effort
    }
  }
}

function describe(value: unknown): string {
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "unknown";
}

function buildClient(transport: CdpTransport, onClose?: () => Promise<void>): CdpClient {
  return {
    async evaluate<T = unknown>(expression: string): Promise<T> {
      const result = (await transport.send<{ result?: { value?: unknown } }>(
        "Runtime.evaluate",
        { expression, returnByValue: true, awaitPromise: true },
      )) as { result?: { value?: unknown } };
      return result.result?.value as T;
    },
    async scrollTo(y: number): Promise<void> {
      await transport.send("Runtime.evaluate", {
        expression: `window.scrollTo(0, ${Number(y)});`,
        returnByValue: true,
        awaitPromise: true,
      });
    },
    async documentHeight(): Promise<number> {
      const result = (await transport.send<{ result?: { value?: unknown } }>(
        "Runtime.evaluate",
        {
          expression:
            "Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0, document.documentElement.offsetHeight, document.body ? document.body.offsetHeight : 0)",
          returnByValue: true,
          awaitPromise: true,
        },
      )) as { result?: { value?: unknown } };
      const value = Number(result.result?.value);
      return Number.isFinite(value) ? value : 0;
    },
    async addStyleTag(css: string): Promise<void> {
      const expression = `(() => {
        const tag = document.createElement('style');
        tag.setAttribute('data-getdesign', '1');
        tag.textContent = ${JSON.stringify(css)};
        document.head.appendChild(tag);
      })();`;
      await transport.send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
    },
    async close(): Promise<void> {
      await transport.close();
      if (onClose) await onClose();
    },
  };
}

/**
 * Open a CDP client connected to the active page target inside the Daytona
 * sandbox. The current host-side tunnel implementation is a documented stub
 * (see `TODO(cdp-tunnel)`); tests and future capture work can pass
 * `resolveTargetUrl`/`webSocketCtor` to bypass it without changing the
 * client surface.
 */
export async function openCdpClient(
  sandbox: Sandbox,
  options: OpenCdpClientOptions = {},
): Promise<CdpClient> {
  const teardown = await openHostTunnel(sandbox);

  let webSocketDebuggerUrl: string | undefined;
  if (options.resolveTargetUrl) {
    webSocketDebuggerUrl = await options.resolveTargetUrl();
  } else {
    const baseUrl =
      options.discoveryBaseUrl ?? `http://127.0.0.1:${teardown.localPort}`;
    const fetchImpl = options.fetchImpl ?? fetch;
    const versionResp = await fetchImpl(`${baseUrl}/json/version`);
    if (!versionResp.ok) {
      await teardown.close();
      throw new Error(
        `CDP discovery failed: ${versionResp.status} ${versionResp.statusText}`,
      );
    }
    const targetsResp = await fetchImpl(`${baseUrl}/json`);
    if (!targetsResp.ok) {
      await teardown.close();
      throw new Error(
        `CDP target list failed: ${targetsResp.status} ${targetsResp.statusText}`,
      );
    }
    const targets = (await targetsResp.json()) as Array<{
      type?: string;
      webSocketDebuggerUrl?: string;
    }>;
    const page = targets.find(
      (target) =>
        target.type === "page" && typeof target.webSocketDebuggerUrl === "string",
    );
    if (!page?.webSocketDebuggerUrl) {
      await teardown.close();
      throw new Error("CDP target list did not include a page target.");
    }
    webSocketDebuggerUrl = page.webSocketDebuggerUrl;
  }

  const SocketCtor =
    options.webSocketCtor ??
    (globalThis as { WebSocket?: new (url: string) => WebSocketLike }).WebSocket;
  if (!SocketCtor) {
    await teardown.close();
    throw new Error(
      "No WebSocket implementation available; pass `webSocketCtor` explicitly.",
    );
  }

  const socket = new SocketCtor(webSocketDebuggerUrl);
  const transport = new JsonRpcCdpTransport(socket);

  return buildClient(transport, () => teardown.close());
}

export type CdpTunnelHandle = {
  /** Local TCP port forwarded to remote `127.0.0.1:9222`. */
  localPort: number;
  /** Tear down the tunnel (and any background ssh process). */
  close: () => Promise<void>;
};

/**
 * Opens an SSH tunnel from the host process to `127.0.0.1:9222` inside the
 * sandbox. The Daytona TS SDK exposes `createSshAccess()` which returns a
 * token and an `sshCommand` string but does not provide a programmatic
 * port-forward primitive, so the real implementation needs to either
 *
 *   1. shell out to `ssh -L <localPort>:127.0.0.1:9222 ...` parsed from
 *      `sshCommand`, or
 *   2. drive an in-process SSH client (e.g. `ssh2`) using the same auth.
 *
 * Until that lands, this stub returns an unused localhost port and a no-op
 * close handler so the rest of the capture pipeline can compile and run in
 * tests with `resolveTargetUrl` injected. Real callers will fail at
 * discovery, which is intentional — we want loud failures rather than a
 * silently-broken capture path.
 */
async function openHostTunnel(_sandbox: Sandbox): Promise<CdpTunnelHandle> {
  // TODO(cdp-tunnel): implement a real SSH tunnel using `createSshAccess()`
  // and an `ssh -L` subprocess (or an in-process SSH client). Track via the
  // capture-pipeline milestone.
  return {
    localPort: 0,
    async close() {
      /* no-op until the tunnel is implemented */
    },
  };
}

/**
 * Convenience helper that opens a CDP client, runs `fn`, and closes the
 * client (and tunnel) on the way out, even if `fn` throws.
 */
export async function withCdpClient<T>(
  sandbox: Sandbox,
  fn: (client: CdpClient) => Promise<T>,
  options: OpenCdpClientOptions = {},
): Promise<T> {
  const client = await openCdpClient(sandbox, options);
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

/**
 * Internal export for tests so the WebSocket-driven JSON-RPC layer can be
 * exercised without going through the (stubbed) tunnel.
 */
export const __testing = { JsonRpcCdpTransport, buildClient };
