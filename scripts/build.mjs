import { spawnSync } from "node:child_process";
import { buildOrder, workspaceName } from "./workspaces.mjs";

for (const workspacePath of buildOrder) {
  run("npm", ["run", "build", "-w", workspaceName(workspacePath)]);
}

function run(command, commandArgs) {
  const result = spawnCommand(command, commandArgs);
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function spawnCommand(command, commandArgs) {
  if (process.platform !== "win32") {
    return spawnSync(command, commandArgs, { stdio: "inherit" });
  }
  return spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", shellLine(command, commandArgs)], {
    stdio: "inherit"
  });
}

function shellLine(command, args) {
  return [command, ...args].map(quote).join(" ");
}

function quote(value) {
  if (/^[A-Za-z0-9_@%+=:,./\\-]+$/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}
