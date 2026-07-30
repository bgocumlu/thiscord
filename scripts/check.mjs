import { spawnSync } from "node:child_process";
import { workspaceName, workspacePaths } from "./workspaces.mjs";

run("npm", ["run", "check:policies", "-w", workspaceName(workspacePaths.shared)]);
run("npm", ["run", "build", "-w", workspaceName(workspacePaths.shared)]);
run("npm", ["run", "i18n:check", "-w", workspaceName(workspacePaths.renderer)]);
run("npm", ["run", "lint", "-w", workspaceName(workspacePaths.renderer)]);
run("npm", ["run", "typecheck", "--workspaces", "--if-present"]);
run("npm", ["run", "test", "--workspaces", "--if-present"]);

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
