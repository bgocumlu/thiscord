import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, sep, extname } from "node:path";

const port = Number(process.env.MOCK_UPDATE_PORT ?? 4400);
const root = resolve(process.argv[2] ?? "release");

const types = new Map([
  [".yml", "text/yaml"],
  [".yaml", "text/yaml"],
  [".json", "application/json"],
  [".blockmap", "application/octet-stream"],
  [".exe", "application/octet-stream"],
  [".dmg", "application/octet-stream"],
  [".zip", "application/zip"],
  [".AppImage", "application/octet-stream"]
]);

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const file = resolve(root, decodeURIComponent(url.pathname.replace(/^\/+/, "")));

  if (file !== root && !file.startsWith(`${root}${sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (!existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": types.get(extname(file)) ?? "application/octet-stream",
    "access-control-allow-origin": "*"
  });
  createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock update server: http://127.0.0.1:${port}/`);
  console.log(`Serving: ${root}`);
});
