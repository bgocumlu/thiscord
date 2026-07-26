import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { rootDir } from "./workspaces.mjs";

function argumentsMap(args) {
  const result = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith("--")) continue;
    const [rawKey, inlineValue] = argument.slice(2).split("=", 2);
    const value = inlineValue ?? args[index + 1];
    if (inlineValue === undefined) index += 1;
    result.set(rawKey, value);
  }
  return result;
}

function required(values, key) {
  const value = values.get(key)?.trim();
  if (!value) throw new Error(`Missing --${key}.`);
  return value.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function requiredUrl(values, key) {
  const value = values.get(key)?.trim().replace(/\/+$/, "");
  if (!value || !/^https:\/\/[^/]+(?:\/.*)?$/i.test(value)) {
    throw new Error(`Missing or invalid --${key}; use a complete https:// URL.`);
  }
  return value;
}

function secret(bytes = 36) {
  return randomBytes(bytes).toString("base64url");
}

const values = argumentsMap(process.argv.slice(2));
const frontendUrl = requiredUrl(values, "frontend-url");
const pocketBaseDomain = required(values, "pocketbase-domain");
const jitsiDomain = required(values, "jitsi-domain");
const turnDomain = required(values, "turn-domain");
const publicIp = required(values, "public-ip");
const email = values.get("email")?.trim();
if (!email || !email.includes("@")) throw new Error("Missing or invalid --email.");
const distributionName = values.get("name")?.trim() || "Thiscord";
const distributionId = (values.get("distribution-id")?.trim() || "thiscord").toLowerCase();
const appId = values.get("app-id")?.trim() || "chat.thiscord.app";
const appProtocol = values.get("protocol")?.trim() || distributionId;
const accent = values.get("accent")?.trim() || "#6957e8";
const supportUrl = values.get("support-url")?.trim().replace(/\/+$/, "") || "";
const updateUrl = values.get("update-url")?.trim().replace(/\/+$/, "") || "";
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(distributionId)) throw new Error("Invalid --distribution-id.");
if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/i.test(appId)) throw new Error("Invalid --app-id.");
if (!/^[a-z][a-z0-9+.-]*$/i.test(appProtocol)) throw new Error("Invalid --protocol.");
if (!/^#[0-9a-f]{6}$/i.test(accent)) throw new Error("Invalid --accent; use a six-digit hex color.");
for (const [name, url] of [["support-url", supportUrl], ["update-url", updateUrl]]) {
  if (url && !/^https:\/\/[^/]+/i.test(url)) throw new Error(`Invalid --${name}; use a complete https:// URL.`);
}

const envPath = resolve(rootDir, ".env");
const distributionPath = resolve(rootDir, "infra/distribution.local.json");
if (existsSync(envPath) || existsSync(distributionPath)) {
  throw new Error("Self-host configuration already exists. Move or remove .env and infra/distribution.local.json first.");
}

let env = await readFile(resolve(rootDir, ".env.example"), "utf8");
const replacements = {
  "https://username.github.io/thiscord": frontendUrl,
  "api.example.com": pocketBaseDomain,
  "meet.example.com": jitsiDomain,
  "turn.example.com": turnDomain,
  "admin@example.com": email,
  "203.0.113.10": publicIp,
  CHANGE_ME_JITSI_APP_SECRET: secret(48),
  CHANGE_ME_JICOFO_AUTH_PASSWORD: secret(),
  CHANGE_ME_JVB_AUTH_PASSWORD: secret(),
  CHANGE_ME_TURN_PASSWORD: secret(),
};
for (const [placeholder, value] of Object.entries(replacements)) {
  env = env.replaceAll(placeholder, value);
}
for (const [key, value] of Object.entries({
  JITSI_APP_ID: distributionId,
  APP_ID: appId,
  APP_NAME: distributionName,
  APP_PROTOCOL: appProtocol,
})) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (!pattern.test(env)) throw new Error(`.env.example is missing ${key}.`);
  env = env.replace(pattern, `${key}=${value}`);
}

const distribution = {
  id: distributionId,
  name: distributionName,
  appId,
  webUrl: frontendUrl,
  pocketBaseUrl: `https://${pocketBaseDomain}`,
  jitsiDomain,
  supportUrl,
  updateUrl,
  accent,
};

await writeFile(envPath, env, { encoding: "utf8", mode: 0o600, flag: "wx" });
await writeFile(distributionPath, `${JSON.stringify(distribution, null, 2)}\n`, {
  encoding: "utf8",
  mode: 0o600,
  flag: "wx",
});

process.stdout.write(
  `Created .env and infra/distribution.local.json for ${frontendUrl}.\n`
  + "Review the files, configure DNS, then run: docker compose up -d --build\n",
);
