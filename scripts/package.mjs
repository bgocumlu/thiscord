import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const platform = readOption("--platform");
const arch = readOption("--arch");
const dir = args.includes("--dir");
const publish = readOption("--publish") ?? "never";

function readOption(name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function run(command, commandArgs, options = {}) {
  const result = spawnCommand(command, commandArgs, options);
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function spawnCommand(command, commandArgs, options) {
  if (process.platform !== "win32") {
    return spawnSync(command, commandArgs, { stdio: "inherit", ...options });
  }
  return spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", shellLine(command, commandArgs)], {
    stdio: "inherit",
    ...options
  });
}

function shellLine(command, args) {
  return [command, ...args].map(quote).join(" ");
}

function quote(value) {
  if (/^[A-Za-z0-9_@%+=:,./\\-]+$/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

run("npm", ["run", "build"]);

const builderArgs = ["electron-builder", "--config", "electron-builder.config.cjs", "--publish", publish];
if (dir) builderArgs.push("--dir");
if (platform) builderArgs.push(`--${platform}`);
if (arch) builderArgs.push(`--${arch}`);

if (!process.env.CSC_LINK && !process.env.WIN_CSC_LINK && !process.env.APPLE_API_KEY) {
  process.env.CSC_IDENTITY_AUTO_DISCOVERY ??= "false";
}

run("npx", builderArgs, { env: process.env });
