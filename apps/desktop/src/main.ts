import type { DesktopCaptureSource, StoredAuthSession, UpdateState } from "@thiscord/shared";
import { app, BrowserWindow, desktopCapturer, ipcMain, safeStorage, shell } from "electron";
import { autoUpdater } from "electron-updater";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { channels } from "./channels.js";

declare const __APP_PROTOCOL__: string;

const isDevelopment = Boolean(process.env.APP_DEV);
const rendererDevUrl = process.env.APP_RENDERER_URL;
const backendDevUrl = process.env.APP_BACKEND_URL;
const smokeMode = process.env.APP_SMOKE === "1";
const smokeCaptureMode = process.env.APP_SMOKE_CAPTURE === "1";
const appName = process.env.APP_NAME || "Thiscord";
const appVersion = isDevelopment ? process.env.APP_VERSION ?? app.getVersion() : app.getVersion();
const openDevTools = process.env.APP_OPEN_DEVTOOLS === "1";
const developmentJitsiUrl = process.env.APP_JITSI_URL || "http://127.0.0.1:8443";
const appProtocol = __APP_PROTOCOL__;

app.setName(appName);
if (isDevelopment) {
  app.setPath("userData", join(app.getPath("appData"), appName));
}

let mainWindow: BrowserWindow | undefined;
let backendProcess: ChildProcess | undefined;
let backendUrl: string | undefined;
let pendingDeepLink: string | undefined;
let pendingDisplaySourceId: string | null = null;

let updateState: UpdateState = app.isPackaged
  ? { status: "idle", currentVersion: appVersion }
  : { status: "disabled", message: "Updates are disabled outside packaged production builds." };

function setUpdateState(next: UpdateState) {
  updateState = next;
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channels.updateState, updateState);
  }
}

function authSessionPath() {
  return join(app.getPath("userData"), "auth-session.bin");
}

function isStoredAuthSession(value: unknown): value is StoredAuthSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<StoredAuthSession>;
  return (
    typeof session.token === "string"
    && session.token.length > 0
    && session.token.length < 16_384
    && Boolean(session.record)
    && typeof session.record === "object"
    && !Array.isArray(session.record)
  );
}

async function getStoredAuthSession(): Promise<StoredAuthSession | null> {
  if (!safeStorage.isEncryptionAvailable()) return null;

  try {
    const encrypted = await readFile(authSessionPath());
    const session: unknown = JSON.parse(safeStorage.decryptString(encrypted));
    if (!isStoredAuthSession(session)) {
      console.warn("Discarding an invalid encrypted auth session.");
      await rm(authSessionPath(), { force: true });
      return null;
    }
    return session;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (code !== "ENOENT") {
      console.warn("Discarding an unreadable encrypted auth session.", error);
      try {
        await rm(authSessionPath(), { force: true });
      } catch (removeError) {
        console.error("Unable to remove the unreadable auth session.", removeError);
      }
    }
    return null;
  }
}

async function setStoredAuthSession(session: StoredAuthSession): Promise<void> {
  if (!isStoredAuthSession(session)) {
    throw new Error("Invalid auth session.");
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure credential storage is unavailable.");
  }

  const target = authSessionPath();
  const temporary = `${target}.tmp`;
  const encrypted = safeStorage.encryptString(JSON.stringify(session));
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(temporary, encrypted, { mode: 0o600 });
  await rename(temporary, target);
}

async function clearStoredAuthSession(): Promise<void> {
  await rm(authSessionPath(), { force: true });
}

function deepLinkPath(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== `${appProtocol}:`) return undefined;
    const path = `/${url.hostname}${url.pathname}`.replace(/\/+/g, "/");
    if (!path.startsWith("/invite/") && !path.startsWith("/channels/")) return undefined;
    return `${path}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}

async function openDeepLink(value: string) {
  const path = deepLinkPath(value);
  if (!path) return;
  if (!mainWindow || !backendUrl) {
    pendingDeepLink = value;
    return;
  }
  await mainWindow.loadURL(new URL(path, `${backendUrl}/`).toString());
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function resolveRendererDist() {
  if (app.isPackaged) {
    return join(app.getAppPath(), "apps/renderer/dist");
  }
  return resolve(__dirname, "../../renderer/dist");
}

async function resolveJitsiUrl() {
  if (isDevelopment) return developmentJitsiUrl;
  if (process.env.APP_JITSI_URL) return process.env.APP_JITSI_URL;

  try {
    const manifest: unknown = JSON.parse(
      await readFile(join(resolveRendererDist(), "distribution.json"), "utf8"),
    );
    if (!manifest || typeof manifest !== "object") throw new Error("Invalid distribution manifest.");
    const domain = (manifest as { jitsiDomain?: unknown }).jitsiDomain;
    if (typeof domain !== "string" || !domain.trim()) throw new Error("Jitsi domain is missing.");
    return /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
  } catch (error) {
    console.error("Unable to resolve the distribution Jitsi origin.", error);
    return developmentJitsiUrl;
  }
}

function resolveBackendEntry() {
  if (app.isPackaged) {
    return join(app.getAppPath(), "apps/local-backend/dist/server.js");
  }
  return resolve(__dirname, "../../local-backend/dist/server.js");
}

function resolveWindowIcon() {
  const extension = process.platform === "win32" ? "ico" : "png";
  if (app.isPackaged) {
    return join(process.resourcesPath, `icon.${extension}`);
  }
  return resolve(__dirname, `../../../build/icon.${extension}`);
}

function waitForBackendReady(child: ChildProcess) {
  return new Promise<string>((resolveReady, rejectReady) => {
    const timeout = setTimeout(() => rejectReady(new Error("Timed out waiting for backend.")), 15_000);

    child.stdout?.on("data", (chunk: Buffer) => {
      for (const line of chunk.toString("utf8").split(/\r?\n/)) {
        if (!line.startsWith("APP_BACKEND_READY ")) continue;
        clearTimeout(timeout);
        const payload = JSON.parse(line.slice("APP_BACKEND_READY ".length)) as { baseUrl: string };
        resolveReady(payload.baseUrl);
      }
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      console.error("[backend]", chunk.toString("utf8").trim());
    });

    child.once("error", rejectReady);
    child.once("exit", (code) => {
      rejectReady(new Error(`Backend exited before it was ready (${code ?? "signal"}).`));
    });
  });
}

async function startProductionBackend() {
  const entryPath = resolveBackendEntry();
  const rendererDist = resolveRendererDist();

  if (!existsSync(entryPath)) {
    throw new Error(`Backend entry is missing: ${entryPath}`);
  }
  if (!existsSync(rendererDist)) {
    throw new Error(`Renderer dist is missing: ${rendererDist}`);
  }

  backendProcess = spawn(process.execPath, [entryPath], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      APP_BACKEND_HOST: "127.0.0.1",
      APP_BACKEND_PORT: "0",
      APP_VERSION: appVersion,
      APP_RENDERER_DIST: rendererDist
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  const child = backendProcess;
  if (!child) {
    throw new Error("Backend process failed to start.");
  }
  backendUrl = await waitForBackendReady(child);
}

function configureUpdates() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("checking-for-update", () => {
    setUpdateState({ status: "checking", currentVersion: appVersion });
  });
  autoUpdater.on("update-not-available", () => {
    setUpdateState({ status: "not-available", currentVersion: appVersion });
  });
  autoUpdater.on("update-available", (info) => {
    setUpdateState({
      status: "available",
      currentVersion: appVersion,
      availableVersion: info.version
    });
  });
  autoUpdater.on("download-progress", (progress) => {
    const current = updateState;
    const availableVersion =
      current.status === "available" || current.status === "downloading" || current.status === "downloaded"
        ? current.availableVersion
        : "unknown";
    setUpdateState({
      status: "downloading",
      currentVersion: appVersion,
      availableVersion,
      percent: Math.round(progress.percent)
    });
  });
  autoUpdater.on("update-downloaded", (info) => {
    setUpdateState({
      status: "downloaded",
      currentVersion: appVersion,
      availableVersion: info.version
    });
  });
  autoUpdater.on("error", (error) => {
    setUpdateState({
      status: "error",
      currentVersion: appVersion,
      message: error instanceof Error ? error.message : String(error)
    });
  });
}

function registerIpc() {
  ipcMain.handle(channels.getVersion, () => appVersion);
  ipcMain.handle(channels.getAuthSession, () => getStoredAuthSession());
  ipcMain.handle(channels.setAuthSession, (_event, session: unknown) => {
    if (!isStoredAuthSession(session)) throw new Error("Invalid auth session.");
    return setStoredAuthSession(session);
  });
  ipcMain.handle(channels.clearAuthSession, () => clearStoredAuthSession());
  ipcMain.handle(channels.updateState, () => updateState);
  ipcMain.handle(channels.checkForUpdates, async () => {
    if (!app.isPackaged) return updateState;
    await autoUpdater.checkForUpdates();
    return updateState;
  });
  ipcMain.handle(channels.downloadUpdate, async () => {
    if (!app.isPackaged) return updateState;
    await autoUpdater.downloadUpdate();
    return updateState;
  });
  ipcMain.handle(channels.installUpdate, () => {
    if (updateState.status !== "downloaded") return { accepted: false };
    autoUpdater.quitAndInstall(true, true);
    return { accepted: true };
  });
  ipcMain.handle(channels.getDisplaySources, async (event) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error("Display capture is unavailable for this window.");
    }
    const sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 320, height: 180 },
      fetchWindowIcons: true
    });
    return sources.map<DesktopCaptureSource>((source) => ({
      id: source.id,
      name: source.name,
      thumbnailUrl: source.thumbnail.toDataURL(),
      appIconUrl: source.appIcon?.toDataURL() ?? ""
    }));
  });
  ipcMain.handle(channels.selectDisplaySource, async (event, sourceId: unknown) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error("Display capture is unavailable for this window.");
    }
    if (sourceId === null) {
      pendingDisplaySourceId = null;
      return;
    }
    if (typeof sourceId !== "string" || !sourceId || sourceId.length > 512) {
      throw new Error("Invalid display source.");
    }
    const sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 1, height: 1 }
    });
    if (!sources.some((source) => source.id === sourceId)) {
      throw new Error("That display source is no longer available.");
    }
    pendingDisplaySourceId = sourceId;
  });
}

async function createMainWindow() {
  const preload = join(__dirname, "preload.cjs");
  const url = isDevelopment ? rendererDevUrl : backendUrl;
  const jitsiUrl = await resolveJitsiUrl();

  if (!url) {
    throw new Error("Renderer URL is not configured.");
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: appName,
    icon: resolveWindowIcon(),
    backgroundColor: "#111827",
    autoHideMenuBar: process.platform !== "darwin",
    webPreferences: {
      preload,
      contextIsolation: true,
      devTools: isDevelopment,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  const trustedOrigins = new Set(
    [url, jitsiUrl]
      .map((value) => {
        try {
          return new URL(value).origin;
        } catch {
          return "";
        }
      })
      .filter(Boolean),
  );
  const mediaPermissions = new Set(["media", "display-capture", "fullscreen"]);

  mainWindow.webContents.session.setPermissionCheckHandler((_webContents, permission, requestingOrigin, details) => {
    const origin = details.requestingUrl || requestingOrigin;
    try {
      return mediaPermissions.has(permission) && trustedOrigins.has(new URL(origin).origin);
    } catch {
      return false;
    }
  });

  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    try {
      const requestingOrigin = new URL(details.requestingUrl).origin;
      callback(mediaPermissions.has(permission) && trustedOrigins.has(requestingOrigin));
    } catch {
      callback(false);
    }
  });

  mainWindow.webContents.session.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      if (!trustedOrigins.has(new URL(request.securityOrigin).origin) || !pendingDisplaySourceId) {
        callback({});
        return;
      }
      const selectedId = pendingDisplaySourceId;
      pendingDisplaySourceId = null;
      const sources = await desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 1, height: 1 }
      });
      const source = sources.find((item) => item.id === selectedId);
      callback(source ? { video: source } : {});
    } catch {
      pendingDisplaySourceId = null;
      callback({});
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith("https://") || targetUrl.startsWith("http://")) {
      void shell.openExternal(targetUrl);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    const allowed = isDevelopment
      ? targetUrl.startsWith(rendererDevUrl ?? "") || targetUrl.startsWith(backendDevUrl ?? "")
      : targetUrl.startsWith(backendUrl ?? "");
    if (!allowed) {
      event.preventDefault();
      if (targetUrl.startsWith("https://") || targetUrl.startsWith("http://")) {
        void shell.openExternal(targetUrl);
      }
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  await mainWindow.loadURL(url);
  if (pendingDeepLink) {
    const value = pendingDeepLink;
    pendingDeepLink = undefined;
    await openDeepLink(value);
  }

  if (smokeMode) {
    if (smokeCaptureMode) {
      const result = await mainWindow.webContents.executeJavaScript(`
        (async () => {
          const sources = await window.desktop.getDisplaySources();
          if (!sources.length) throw new Error("No display sources were returned.");
          await window.desktop.selectDisplaySource(sources[0].id);
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          const tracks = stream.getVideoTracks();
          const active = tracks.length === 1 && tracks[0].readyState === "live";
          for (const track of stream.getTracks()) track.stop();
          return { sources: sources.length, active };
        })()
      `) as { readonly sources: number; readonly active: boolean };
      if (!result.active) throw new Error("Electron display capture did not produce a live video track.");
      console.log(`APP_CAPTURE_READY ${result.sources}`);
    }
    setTimeout(() => app.quit(), 800);
    return;
  }

  if (isDevelopment && openDevTools) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  if (process.defaultApp && process.argv[1]) {
    app.setAsDefaultProtocolClient(appProtocol, process.execPath, [resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(appProtocol);
  }

  const initialDeepLink = process.argv.find((argument) => argument.startsWith(`${appProtocol}://`));
  if (initialDeepLink) pendingDeepLink = initialDeepLink;

  app.on("open-url", (event, url) => {
    event.preventDefault();
    void openDeepLink(url);
  });

  app.on("second-instance", (_event, argv) => {
    const link = argv.find((argument) => argument.startsWith(`${appProtocol}://`));
    if (link) {
      void openDeepLink(link);
      return;
    }
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    registerIpc();
    configureUpdates();

    if (isDevelopment) {
      backendUrl = backendDevUrl;
    } else {
      await startProductionBackend();
    }

    await createMainWindow();
  }).catch((error) => {
    console.error(error);
    app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow();
    }
  });

  app.on("before-quit", () => {
    backendProcess?.kill();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
