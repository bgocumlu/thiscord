import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import { fromRoot, workspacePackageFiles } from "./workspaces.mjs";

const args = process.argv.slice(2);
const title = readOption("--name")?.trim();
const appId = readOption("--id")?.trim();
const slug = (readOption("--slug") ?? title ?? "").trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");
const scope = readOption("--scope")?.trim() || `@${slug}`;
const protocol = readOption("--protocol")?.trim() || slug;

if (
  !title
  || !/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/i.test(appId ?? "")
  || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  || !/^@[a-z0-9][a-z0-9._-]*$/i.test(scope)
  || !/^[a-z][a-z0-9+.-]*$/i.test(protocol)
) {
  console.error(
    "Usage: npm run init:app -- --name \"My App\" --id com.company.myapp "
    + "[--slug my-app] [--scope @company] [--protocol my-app]",
  );
  process.exit(1);
}

const packageFiles = ["package.json", ...workspacePackageFiles()];
for (const file of packageFiles) {
  const json = JSON.parse(readFileSync(fromRoot(file), "utf8"));
  if (file === "package.json") {
    json.name = slug;
    json.author = `${title} contributors`;
  } else if (json.name?.startsWith("@thiscord/")) {
    json.name = json.name.replace("@thiscord", scope);
  }
  replaceDependencyScope(json.dependencies);
  replaceDependencyScope(json.devDependencies);
  writeFileSync(fromRoot(file), `${JSON.stringify(json, null, 2)}\n`);
}

for (const file of textFiles()) {
  replaceInFile(file, [
    ["@thiscord/", `${scope}/`],
    ["chat.thiscord.app", appId],
    ["Thiscord", title],
    ['"id": "thiscord"', `"id": "${slug}"`],
    ["JITSI_APP_ID=thiscord", `JITSI_APP_ID=${slug}`],
    ['|| "thiscord"', `|| "${protocol}"`],
  ]);
}

console.log(
  `Rebranded the source distribution as ${title} (${appId}).\n`
  + "Replace build/icon.png, build/icon.ico, and the renderer icons, then run npm install and npm run check.",
);

function textFiles() {
  const roots = [
    ".env.example",
    ".github",
    "README.md",
    "electron-builder.config.cjs",
    "apps",
    "compose.yml",
    "docs",
    "infra",
    "packages",
  ];
  const files = new Set();
  for (const root of roots) collectTextFiles(root, files);
  return [...files].sort();
}

function collectTextFiles(relativePath, files) {
  const absolutePath = fromRoot(relativePath);
  if (!existsSync(absolutePath)) return;
  const ignoredNames = new Set([".git", "node_modules", "dist", "release", "pb_data"]);
  const name = relativePath.split(/[\\/]/).at(-1);
  if (ignoredNames.has(name)) return;
  const stats = statSync(absolutePath);
  if (stats.isDirectory()) {
    for (const entry of readdirSync(absolutePath)) collectTextFiles(`${relativePath}/${entry}`, files);
  } else if (stats.isFile() && isTextFile(relativePath)) {
    files.add(relativePath);
  }
}

function isTextFile(file) {
  return new Set([".cjs", ".css", ".html", ".js", ".json", ".md", ".mjs", ".ts", ".tsx", ".yml", ".yaml"])
    .has(extname(file));
}

function replaceDependencyScope(dependencies) {
  if (!dependencies) return;
  for (const key of Object.keys(dependencies)) {
    if (!key.startsWith("@thiscord/")) continue;
    const nextKey = key.replace("@thiscord", scope);
    dependencies[nextKey] = dependencies[key];
    delete dependencies[key];
  }
}

function replaceInFile(file, replacements) {
  let text = readFileSync(fromRoot(file), "utf8");
  for (const [from, to] of replacements) text = text.split(from).join(to);
  writeFileSync(fromRoot(file), text);
}

function readOption(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}
