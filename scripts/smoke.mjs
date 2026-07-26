import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { distPaths } from "./workspaces.mjs";

function run(command, args) {
  const result = spawnCommand(command, args);
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function spawnCommand(command, args) {
  if (process.platform !== "win32") {
    return spawnSync(command, args, { stdio: "inherit" });
  }
  return spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], {
    stdio: "inherit"
  });
}

run("npm", ["run", "build"]);

const required = [
  distPaths.desktopMain,
  distPaths.desktopPreload,
  distPaths.localBackendServer,
  distPaths.rendererIndex
];

const missing = required.filter((file) => !existsSync(file));
if (missing.length > 0) {
  console.error(`Smoke check failed. Missing files: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Smoke check passed.");
