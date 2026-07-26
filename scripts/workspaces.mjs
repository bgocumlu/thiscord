import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));

export const workspacePaths = {
  desktop: "apps/desktop",
  renderer: "apps/renderer",
  localBackend: "apps/local-backend",
  shared: "packages/shared",
  pocketbase: "packages/pocketbase"
};

export const buildOrder = [
  workspacePaths.shared,
  workspacePaths.pocketbase,
  workspacePaths.localBackend,
  workspacePaths.renderer,
  workspacePaths.desktop
];

export const distPaths = {
  desktopMain: "apps/desktop/dist/main.cjs",
  desktopPreload: "apps/desktop/dist/preload.cjs",
  localBackendServer: "apps/local-backend/dist/server.js",
  localBackendDist: "apps/local-backend/dist",
  rendererIndex: "apps/renderer/dist/index.html",
  rendererDist: "apps/renderer/dist",
  desktopDist: "apps/desktop/dist",
  sharedDist: "packages/shared/dist",
  release: "release",
  rootDist: "dist"
};

export function fromRoot(...segments) {
  return resolve(rootDir, ...segments);
}

export function readJson(relativePath) {
  return JSON.parse(readFileSync(fromRoot(relativePath), "utf8"));
}

export function workspaceName(relativePath) {
  return readJson(`${relativePath}/package.json`).name;
}

export function workspacePackageFiles() {
  const rootPackage = readJson("package.json");
  return (rootPackage.workspaces ?? []).flatMap(resolveWorkspacePattern).sort();
}

function resolveWorkspacePattern(pattern) {
  if (!pattern.endsWith("/*")) {
    return existsSync(fromRoot(pattern, "package.json")) ? [`${pattern}/package.json`] : [];
  }

  const parent = pattern.slice(0, -2);
  const parentPath = fromRoot(parent);
  if (!existsSync(parentPath)) return [];

  return readdirSync(parentPath)
    .map((entry) => `${parent}/${entry}`)
    .filter((relativePath) => {
      const absolutePath = fromRoot(relativePath);
      return statSync(absolutePath).isDirectory() && existsSync(resolve(absolutePath, "package.json"));
    })
    .map((relativePath) => `${relativePath}/package.json`);
}
