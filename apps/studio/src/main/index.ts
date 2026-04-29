import { app, BrowserWindow, protocol, shell } from "electron";
import { readFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { initAutoUpdater } from "./updater";
import { registerStudioIpc } from "./pi-service";

const isDev = !app.isPackaged;
const ARTIFACT_PROTOCOL = "studio-artifact";

protocol.registerSchemesAsPrivileged([
  {
    scheme: ARTIFACT_PROTOCOL,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "customButtonsOnHover" : "hidden",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => mainWindow.show());
  registerStudioIpc(mainWindow);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const devUrl = process.env["ELECTRON_RENDERER_URL"];
  if (isDev && devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  registerArtifactProtocol();
  createWindow();
  initAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function registerArtifactProtocol(): void {
  protocol.handle(ARTIFACT_PROTOCOL, async (request) => {
    const url = new URL(request.url);
    if (url.hostname !== "artifacts") {
      return new Response("Unknown Studio preview host.", { status: 404 });
    }

    const [artifactId, ...relativeParts] = url.pathname
      .split("/")
      .filter(Boolean)
      .map((part) => decodeURIComponent(part));
    if (!artifactId) {
      return new Response("Missing artifact id.", { status: 400 });
    }

    const artifactRoot = join(app.getPath("userData"), "artifacts", safePathSegment(artifactId));
    const requestedPath = resolve(artifactRoot, relativeParts.join("/") || "index.html");
    if (!isPathInside(artifactRoot, requestedPath)) {
      return new Response("Invalid preview path.", { status: 400 });
    }

    try {
      const data = await readFile(requestedPath);
      return new Response(data, {
        headers: {
          "content-type": contentTypeForPath(requestedPath),
        },
      });
    } catch {
      return new Response("Artifact file not found.", { status: 404 });
    }
  });
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function isPathInside(root: string, target: string): boolean {
  const rel = relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function contentTypeForPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".html")) return "text/html; charset=utf-8";
  if (lower.endsWith(".css")) return "text/css; charset=utf-8";
  if (lower.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (lower.endsWith(".json")) return "application/json; charset=utf-8";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".woff2")) return "font/woff2";
  if (lower.endsWith(".woff")) return "font/woff";
  return "application/octet-stream";
}
