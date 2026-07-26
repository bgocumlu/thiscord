import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { existsSync, watch } from "node:fs";
import net from "node:net";
import { distPaths, fromRoot, readJson, workspaceName, workspacePaths } from "./workspaces.mjs";

const require = createRequire(import.meta.url);
const electronPath = require("electron");

const externalServices = process.argv.includes("--external");
const rendererPort = Number(process.env.APP_RENDERER_PORT ?? 5173);
const backendPort = Number(process.env.APP_BACKEND_PORT ?? 8787);
const host = "127.0.0.1";
const rendererUrl = process.env.APP_RENDERER_URL ?? `http://${host}:${rendererPort}/`;
const backendUrl = `http://${host}:${backendPort}`;
const desktopMain = fromRoot(distPaths.desktopMain);
const desktopPreload = fromRoot(distPaths.desktopPreload);
const appVersion = readJson("package.json").version;

const children = new Set();
let electron = undefined;
let restartTimer = undefined;
let shuttingDown = false;

function spawnManaged(name, command, args, options = {}) {
  const resolved = resolveCommand(command, args);
  const child = spawn(resolved.command, resolved.args, {
    stdio: ["inherit", "pipe", "pipe"],
    env: process.env,
    ...options
  });
  children.add(child);
  child.stdout.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  child.on("exit", (code) => {
    children.delete(child);
    if (!shuttingDown && code !== 0) {
      console.error(`[${name}] exited with ${code}`);
    }
  });
  return child;
}

function resolveCommand(command, args) {
  if (command === "npm" && process.env.npm_execpath) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath, ...args]
    };
  }

  return { command, args };
}

function waitForTcp(port, timeoutMs = 120_000) {
  const startedAt = Date.now();
  return new Promise((resolveReady, rejectReady) => {
    const attempt = () => {
      const socket = net.createConnection({ host, port });
      socket.once("connect", () => {
        socket.destroy();
        resolveReady();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - startedAt > timeoutMs) {
          rejectReady(new Error(`Timed out waiting for ${host}:${port}`));
        } else {
          setTimeout(attempt, 150);
        }
      });
    };
    attempt();
  });
}

function waitForFiles(files, timeoutMs = 120_000) {
  const startedAt = Date.now();
  return new Promise((resolveReady, rejectReady) => {
    const attempt = () => {
      const missing = files.filter((file) => !existsSync(file));
      if (missing.length === 0) {
        resolveReady();
        return;
      }
      if (Date.now() - startedAt > timeoutMs) {
        rejectReady(new Error(`Timed out waiting for files: ${missing.join(", ")}`));
        return;
      }
      setTimeout(attempt, 150);
    };
    attempt();
  });
}

function startElectron() {
  if (electron || shuttingDown) return;
  electron = spawn(electronPath, [desktopMain], {
    stdio: "inherit",
    env: {
      ...process.env,
      APP_DEV: "1",
      APP_VERSION: appVersion,
      APP_RENDERER_URL: rendererUrl,
      APP_BACKEND_URL: rendererUrl,
      VITE_POCKETBASE_URL: process.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090",
      APP_JITSI_URL: process.env.APP_JITSI_URL || "http://127.0.0.1:8443"
    }
  });
  children.add(electron);
  electron.on("exit", () => {
    children.delete(electron);
    electron = undefined;
  });
}

function restartElectron() {
  if (shuttingDown) return;
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    if (electron) {
      electron.kill();
      electron.once("exit", startElectron);
    } else {
      startElectron();
    }
  }, 120);
}

async function shutdown(code = 0) {
  shuttingDown = true;
  clearTimeout(restartTimer);
  for (const child of [...children]) {
    child.kill();
  }
  setTimeout(() => process.exit(code), 300).unref();
}

process.once("SIGINT", () => void shutdown(130));
process.once("SIGTERM", () => void shutdown(143));

if (!externalServices) {
  spawnManaged("local-backend", "npm", ["run", "dev", "-w", workspaceName(workspacePaths.localBackend)], {
    env: {
      ...process.env,
      APP_BACKEND_HOST: host,
      APP_BACKEND_PORT: String(backendPort),
      NODE_ENV: "development",
      APP_VERSION: appVersion
    }
  });

  spawnManaged("renderer", "npm", ["run", "dev", "-w", workspaceName(workspacePaths.renderer), "--", "--port", String(rendererPort)], {
    env: {
      ...process.env,
      PORT: String(rendererPort),
      APP_BACKEND_URL: backendUrl,
      VITE_POCKETBASE_URL: process.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090",
      VITE_JITSI_DOMAIN: process.env.VITE_JITSI_DOMAIN || "127.0.0.1:8443"
    }
  });
}

spawnManaged("desktop", "npm", ["run", "watch", "-w", workspaceName(workspacePaths.desktop)]);

await Promise.all([
  waitForTcp(rendererPort),
  ...(!externalServices ? [waitForTcp(backendPort)] : []),
  waitForFiles([desktopMain, desktopPreload])
]);

for (const file of [desktopMain, desktopPreload]) {
  watch(file, { persistent: true }, restartElectron);
}

startElectron();
