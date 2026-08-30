/* Barefoot — tiny static server for previewing demo/.
   Zero dependencies. Usage: npm run preview  → http://localhost:4173 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, dirname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT || 4173;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(req.url.split("?")[0]);
    if (path === "/") path = "/docs/";
    if (path.endsWith("/")) path += "index.html";

    const file = normalize(join(root, path));
    // Prefix check only: a sibling directory whose name starts with the
    // project folder's (e.g. "Barefoot CSS 2") would otherwise pass
    // startsWith(root). Require containment with the separator.
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end("forbidden");
      return;
    }

    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": types[extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("not found");
  }
}).listen(port, () => {
  console.log(`Barefoot preview → http://localhost:${port}`);
});
