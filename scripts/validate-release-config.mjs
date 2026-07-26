import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { rootDir } from "./workspaces.mjs";

const distributionPath = resolve(rootDir, process.env.DISTRIBUTION_FILE || "infra/distribution.json");
const distribution = JSON.parse(await readFile(distributionPath, "utf8"));
const required = ["id", "name", "appId", "webUrl", "pocketBaseUrl", "jitsiDomain", "accent"];

for (const field of required) {
  if (typeof distribution[field] !== "string" || !distribution[field].trim()) {
    throw new Error(`Distribution field "${field}" is required.`);
  }
}

for (const field of ["webUrl", "pocketBaseUrl"]) {
  const url = new URL(distribution[field]);
  if (url.protocol !== "https:") throw new Error(`${field} must use HTTPS for a release build.`);
  if (["localhost", "127.0.0.1"].includes(url.hostname) || url.hostname.endsWith(".example.com")) {
    throw new Error(`${field} still contains a development or example hostname.`);
  }
}

const jitsiHost = distribution.jitsiDomain
  .replace(/^https?:\/\//i, "")
  .replace(/\/.*$/, "")
  .split(":")[0];
if (!jitsiHost || ["localhost", "127.0.0.1"].includes(jitsiHost) || jitsiHost.endsWith(".example.com")) {
  throw new Error("jitsiDomain still contains a development or example hostname.");
}
if (!/^#[0-9a-f]{6}$/i.test(distribution.accent)) {
  throw new Error("accent must be a six-digit hexadecimal color.");
}
if (process.env.APP_ID && process.env.APP_ID !== distribution.appId) {
  throw new Error("APP_ID must match distribution.appId.");
}
if (process.env.APP_NAME && process.env.APP_NAME !== distribution.name) {
  throw new Error("APP_NAME must match distribution.name.");
}
if (process.env.APP_PROTOCOL && !/^[a-z][a-z0-9+.-]*$/i.test(process.env.APP_PROTOCOL)) {
  throw new Error("APP_PROTOCOL must be a valid custom protocol scheme.");
}

process.stdout.write(`Release distribution validated: ${distribution.name} (${distribution.id}).\n`);
