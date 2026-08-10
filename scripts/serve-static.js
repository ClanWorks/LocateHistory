#!/usr/bin/env node
// Minimal zero-dependency static file server for public/, used by the
// E2E test suite (playwright.config.js) and available for local manual
// testing. Deliberately not a project dependency on something like
// `serve` — this needs to be reliable in CI without an extra registry
// fetch on every run.
//
// Usage: node scripts/serve-static.js [port] [directory]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2]) || 4173;
const root = path.resolve(process.argv[3] || path.join(__dirname, "..", "public"));

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const resolved = path.normalize(path.join(root, urlPath === "/" ? "/index.html" : urlPath));

  if (!resolved.startsWith(root)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }

  fs.readFile(resolved, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("not found");
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`serving ${root} at http://localhost:${port}`);
});
