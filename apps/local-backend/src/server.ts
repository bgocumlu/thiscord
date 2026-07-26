import type { HealthResponse } from "@template/shared";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 0;

const contentTypes = new Map<string, string>([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".woff2", "font/woff2"]
]);

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*"
  });
  response.end(JSON.stringify(body));
}

function sendText(response: ServerResponse, status: number, body: string) {
  response.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(body);
}

function resolveStaticFile(rendererDist: string, requestPath: string): string | undefined {
  const decodedPath = decodeURIComponent(requestPath.split("?")[0] ?? "/");
  const normalizedPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const relativePath = normalizedPath === sep || normalizedPath === "/" ? "index.html" : normalizedPath.replace(/^[/\\]/, "");
  const candidate = resolve(rendererDist, relativePath);
  const root = resolve(rendererDist);

  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
    return undefined;
  }

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }

  const fallback = join(root, "index.html");
  return existsSync(fallback) ? fallback : undefined;
}

async function serveStatic(response: ServerResponse, filePath: string) {
  const extension = extname(filePath).toLowerCase();
  response.writeHead(200, {
    "content-type": contentTypes.get(extension) ?? "application/octet-stream",
    "cache-control": filePath.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable"
  });
  createReadStream(filePath).pipe(response);
}

export interface BackendOptions {
  readonly host?: string;
  readonly port?: number;
  readonly rendererDist?: string;
  readonly appVersion?: string;
  readonly mode?: "development" | "production";
}

export async function startBackend(options: BackendOptions = {}) {
  const host = options.host ?? process.env.APP_BACKEND_HOST ?? DEFAULT_HOST;
  const port = options.port ?? Number(process.env.APP_BACKEND_PORT ?? DEFAULT_PORT);
  const rendererDist = options.rendererDist ?? process.env.APP_RENDERER_DIST;
  const appVersion = options.appVersion ?? process.env.APP_VERSION ?? "0.0.0";
  const mode = options.mode ?? (process.env.NODE_ENV === "production" ? "production" : "development");

  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "content-type"
      });
      response.end();
      return;
    }

    if (url.pathname === "/api/health") {
      const body: HealthResponse = { ok: true, appVersion, mode };
      sendJson(response, 200, body);
      return;
    }

    if (!rendererDist) {
      sendText(response, 404, "Renderer distribution path is not configured.");
      return;
    }

    const filePath = resolveStaticFile(rendererDist, url.pathname);
    if (!filePath) {
      sendText(response, 404, "Not found.");
      return;
    }

    try {
      await readFile(filePath);
      await serveStatic(response, filePath);
    } catch {
      sendText(response, 500, "Failed to read static asset.");
    }
  });

  await new Promise<void>((resolveReady, rejectReady) => {
    server.once("error", rejectReady);
    server.listen(port, host, () => {
      server.off("error", rejectReady);
      resolveReady();
    });
  });

  const address = server.address();
  const resolvedPort = typeof address === "object" && address ? address.port : port;
  const baseUrl = `http://${host}:${resolvedPort}`;

  return {
    server,
    host,
    port: resolvedPort,
    baseUrl,
    close: () => new Promise<void>((resolveClose) => server.close(() => resolveClose()))
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const backend = await startBackend();
  process.stdout.write(`APP_BACKEND_READY ${JSON.stringify({ baseUrl: backend.baseUrl, port: backend.port })}\n`);

  const shutdown = async () => {
    await backend.close();
    process.exit(0);
  };

  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}
