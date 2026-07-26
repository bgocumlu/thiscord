import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const args = process.argv.slice(2);
const target = readOption("--to");
const source = resolve(readOption("--from") ?? "release");

if (!target) {
  console.error("Usage: npm run publish:local -- --to C:\\path\\to\\updates [--from release]");
  process.exit(1);
}

if (!existsSync(source)) {
  console.error(`Source directory does not exist: ${source}`);
  process.exit(1);
}

const output = resolve(target);
mkdirSync(output, { recursive: true });

let copied = 0;
for (const file of readdirSync(source)) {
  const from = join(source, file);
  if (!statSync(from).isFile()) continue;
  if (!isReleaseAsset(file)) continue;
  copyFileSync(from, join(output, basename(file)));
  copied += 1;
}

console.log(`Copied ${copied} release asset(s) to ${output}.`);

function readOption(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function isReleaseAsset(file) {
  return /\.(exe|dmg|zip|AppImage|yml|yaml|blockmap)$/i.test(file);
}
