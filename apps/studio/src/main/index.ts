import { app, BrowserWindow, net, protocol, shell } from "electron";
import { isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
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
    titleBarStyle: "hiddenInset",
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
  protocol.handle(ARTIFACT_PROTOCOL, (request) => {
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

    return net.fetch(pathToFileURL(requestedPath).toString());
  });
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function isPathInside(root: string, target: string): boolean {
  const rel = relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}
