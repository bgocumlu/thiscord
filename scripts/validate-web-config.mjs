import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { rootDir } from "./workspaces.mjs";

const manifestPath = resolve(rootDir, process.env.DISTRIBUTION_FILE ?? "infra/distribution.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

for (const key of ["webUrl", "pocketBaseUrl"]) {
  const value = manifest[key];
  if (typeof value !== "string" || !value.startsWith("https://")) {
    throw new Error(`${key} must be a public HTTPS URL in ${manifestPath}.`);
  }
  if (/(example\.com|username\.github\.io|localhost|127\.0\.0\.1)/i.test(value)) {
    throw new Error(`${key} still contains a placeholder or local address.`);
  }
}

if (
  typeof manifest.jitsiDomain !== "string"
  || !manifest.jitsiDomain
  || /^(https?:\/\/)|example\.com|localhost|127\.0\.0\.1/i.test(manifest.jitsiDomain)
) {
  throw new Error("jitsiDomain must be a public hostname without a URL scheme.");
}

process.stdout.write(`Validated web distribution: ${manifestPath}\n`);
