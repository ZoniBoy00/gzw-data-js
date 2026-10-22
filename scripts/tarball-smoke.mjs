#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { npm } from "./npm.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temp = mkdtempSync(resolve(tmpdir(), "gzw-data-client-smoke-"));

try {
  const tarball = npm(["pack", "--pack-destination", temp, "--silent"], { cwd: root, encoding: "utf8" }).trim();
  const packageFile = resolve(temp, tarball);
  npm(["init", "-y"], { cwd: temp, stdio: "ignore" });
  npm(["install", "--ignore-scripts", packageFile], { cwd: temp, stdio: "inherit" });

  const packageEntry = resolve(temp, "node_modules/@zoniboy/gzw-data-client/dist/index.js");
  const { GzwDataClient } = await import(pathToFileURL(packageEntry).href);
  const client = new GzwDataClient({
    retries: 0,
    fetch: async () => new Response(JSON.stringify({ data: { ok: true, version: "4.3.0" } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  });

  assert.deepEqual(await client.health(), { ok: true, version: "4.3.0" });
  console.log(JSON.stringify({ packageFile, import: "ok", apiCall: "ok", status: "ok" }, null, 2));
} finally {
  rmSync(temp, { recursive: true, force: true });
}
