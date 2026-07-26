import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

run("node", ["scripts/package.mjs", "--dir"]);

const executable = findPackagedExecutable();
if (!executable) {
  console.error("Could not find packaged executable in release/.");
  process.exit(1);
}

const result = spawnSync(executable, [], {
  env: {
    ...process.env,
    APP_SMOKE: "1"
  },
  timeout: 20_000,
  stdio: "inherit"
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`Packaged app exited with ${result.status}.`);
  process.exit(result.status ?? 1);
}

console.log("Packaged app launch smoke passed.");

function findPackagedExecutable() {
  if (existsSync("release/win-unpacked")) {
    const match = readdirSync("release/win-unpacked").find((entry) => entry.endsWith(".exe"));
    if (match) return join(process.cwd(), "release/win-unpacked", match);
  }

  if (existsSync("release/mac")) {
    const appBundle = readdirSync("release/mac").find((entry) => entry.endsWith(".app"));
    if (appBundle) {
      const name = appBundle.replace(/\.app$/, "");
      return join(process.cwd(), "release/mac", appBundle, "Contents/MacOS", name);
    }
  }

  if (existsSync("release/linux-unpacked")) {
    const match = readdirSync("release/linux-unpacked").find((entry) => !entry.includes("."));
    if (match) return join(process.cwd(), "release/linux-unpacked", match);
  }

  return undefined;
}

function run(command, args) {
  const result =
    process.platform === "win32"
      ? spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], {
          stdio: "inherit"
        })
      : spawnSync(command, args, { stdio: "inherit" });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
