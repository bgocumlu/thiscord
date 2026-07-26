import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import { fromRoot, workspacePackageFiles } from "./workspaces.mjs";

const args = process.argv.slice(2);
const name = readOption("--name");
const appId = readOption("--id");
const scope = readOption("--scope") ?? "@app";

if (!name || !appId) {
  console.error("Usage: npm run init:app -- --name my-app --id com.company.myapp [--scope @company]");
  process.exit(1);
}

const title = toTitle(name);
const packageFiles = ["package.json", ...workspacePackageFiles()];

for (const file of packageFiles) {
  const json = JSON.parse(readFileSync(fromRoot(file), "utf8"));
  if (file === "package.json") {
    json.name = name;
  } else if (json.name?.startsWith("@template/")) {
    json.name = json.name.replace("@template", scope);
  }
  replaceDependencyScope(json.dependencies);
  replaceDependencyScope(json.devDependencies);
  writeFileSync(fromRoot(file), `${JSON.stringify(json, null, 2)}\n`);
}

for (const file of textFiles()) {
  replaceInFile(file, [
    ["@template/", `${scope}/`],
    ["com.example.electronTemplate", appId],
    ["Electron Template", title]
  ]);
}

console.log(`Initialized ${name} (${appId}) with scope ${scope}. Run npm install next.`);

function textFiles() {
  const roots = [
    ".env.example",
    "README.md",
    "electron-builder.config.cjs",
    "package.json",
    "tsconfig.base.json",
    "apps",
    "packages",
    "docs"
  ];
  const files = new Set();
  for (const root of roots) {
    collectTextFiles(root, files);
  }
  return [...files].sort();
}

function collectTextFiles(relativePath, files) {
  const absolutePath = fromRoot(relativePath);
  if (!existsSync(absolutePath)) return;

  const ignoredNames = new Set([".git", "node_modules", "dist", "release"]);
  const name = relativePath.split(/[\\/]/).at(-1);
  if (ignoredNames.has(name)) return;

  const stats = statSync(absolutePath);
  if (stats.isDirectory()) {
    for (const entry of readdirSync(absolutePath)) {
      collectTextFiles(`${relativePath}/${entry}`, files);
    }
    return;
  }

  if (stats.isFile() && isTextFile(relativePath)) {
    files.add(relativePath);
  }
}

function isTextFile(file) {
  return new Set([
    ".cjs",
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".ts",
    ".tsx",
    ".yml",
    ".yaml"
  ]).has(extname(file));
}

function replaceDependencyScope(dependencies) {
  if (!dependencies) return;
  for (const key of Object.keys(dependencies)) {
    if (!key.startsWith("@template/")) continue;
    const nextKey = key.replace("@template", scope);
    dependencies[nextKey] = dependencies[key];
    delete dependencies[key];
  }
}

function replaceInFile(file, replacements) {
  let text = readFileSync(fromRoot(file), "utf8");
  for (const [from, to] of replacements) {
    text = text.split(from).join(to);
  }
  writeFileSync(fromRoot(file), text);
}

function readOption(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function toTitle(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
