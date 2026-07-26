import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import rootPackage from "../package.json" with { type: "json" };

const args = process.argv.slice(2);
const provider = readOption("--provider") ?? process.env.UPDATE_PROVIDER ?? "generic";
const version = readOption("--version") ?? rootPackage.version;
const channel = readOption("--channel") ?? process.env.RELEASE_CHANNEL ?? "latest";

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

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Invalid release version: ${version}`);
  process.exit(1);
}

run("node", ["scripts/package.mjs"], {
  env: {
    ...process.env,
    RELEASE_CHANNEL: channel,
    UPDATE_PROVIDER: provider
  }
});

const releaseDir = join(process.cwd(), "release");
const artifacts = existsSync(releaseDir)
  ? readdirSync(releaseDir).filter((name) => !name.startsWith("builder-"))
  : [];

if (artifacts.length === 0) {
  console.error("No release artifacts were produced.");
  process.exit(1);
}

if (provider === "github") {
  const tag = `v${version}`;
  const releaseArgs = [
    "release",
    "create",
    tag,
    ...artifacts.map((artifact) => join(releaseDir, artifact)),
    "--title",
    tag,
    "--notes",
    `${rootPackage.name} ${tag}`,
    channel === "latest" ? "--latest" : "--prerelease"
  ];
  run("gh", releaseArgs);
} else {
  console.log("Release artifacts are ready in ./release");
  console.log("Upload every installer, *.yml, and *.blockmap file to your configured update URL.");
}
