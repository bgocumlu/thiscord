import { build, context } from "esbuild";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const watch = process.argv.includes("--watch");
const root = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const outdir = resolve(root, "apps/desktop/dist");
const appProtocol = process.env.APP_PROTOCOL || "thiscord";

if (!watch) {
  rmSync(outdir, { recursive: true, force: true });
}

const common = {
  bundle: true,
  platform: "node",
  target: "node24",
  external: ["electron"],
  sourcemap: true,
  logLevel: "info"
};

const configs = [
  {
    ...common,
    entryPoints: [resolve(root, "apps/desktop/src/main.ts")],
    outfile: resolve(root, "apps/desktop/dist/main.cjs"),
    format: "cjs",
    define: {
      __APP_PROTOCOL__: JSON.stringify(appProtocol)
    }
  },
  {
    ...common,
    entryPoints: [resolve(root, "apps/desktop/src/preload.ts")],
    outfile: resolve(root, "apps/desktop/dist/preload.cjs"),
    format: "cjs"
  }
];

if (watch) {
  const contexts = await Promise.all(configs.map((config) => context(config)));
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log("[desktop] watching main/preload");
  await new Promise(() => undefined);
} else {
  await Promise.all(configs.map((config) => build(config)));
}
