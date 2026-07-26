import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const files = [];

for (const directory of ["pb_hooks", "pb_migrations"]) {
  collect(resolve(root, directory));
}

for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function collect(path) {
  for (const entry of readdirSync(path)) {
    const candidate = resolve(path, entry);
    if (statSync(candidate).isDirectory()) {
      collect(candidate);
    } else if (candidate.endsWith(".js")) {
      files.push(candidate);
    }
  }
}
