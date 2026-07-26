import type { UpdateState } from "@template/shared";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { autoUpdater } from "electron-updater";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { channels } from "./channels.js";

const isDevelopment = Boolean(process.env.APP_DEV);
const rendererDevUrl = process.env.APP_RENDERER_URL;
const backendDevUrl = process.env.APP_BACKEND_URL;
const smokeMode = process.env.APP_SMOKE === "1";
const appName = process.env.APP_NAME || "Electron Template";
const appVersion = isDevelopment ? process.env.APP_VERSION ?? app.getVersion() : app.getVersion();
const openDevTools = process.env.APP_OPEN_DEVTOOLS === "1";

let mainWindow: BrowserWindow | undefined;
let backendProcess: ChildProcess | undefined;
let backendUrl: string | undefined;

let updateState: UpdateState = app.isPackaged
  ? { status: "idle", currentVersion: appVersion }
  : { status: "disabled", message: "Updates are disabled outside packaged production builds." };

function setUpdateState(next: UpdateState) {
  updateState = next;
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channels.updateState, updateState);
  }
}

function resolveRendererDist() {
  if (app.isPackaged) {
    return join(app.getAppPath(), "apps/renderer/dist");
  }
  return resolve(__dirname, "../../renderer/dist");
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
}

async function createMainWindow() {
  const preload = join(__dirname, "preload.cjs");
  const url = isDevelopment ? rendererDevUrl : backendUrl;

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

  if (smokeMode) {
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
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    app.setName(appName);
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
