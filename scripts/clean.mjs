import { rmSync } from "node:fs";
import { distPaths } from "./workspaces.mjs";

for (const path of [
  distPaths.release,
  distPaths.rootDist,
  distPaths.localBackendDist,
  distPaths.desktopDist,
  distPaths.rendererDist,
  distPaths.sharedDist
]) {
  rmSync(path, { recursive: true, force: true });
}
