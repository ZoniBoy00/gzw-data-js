#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const packageName = "@zoniboy/gzw-data-client";
const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error("Usage: node scripts/published-smoke.mjs <version>");
}

const root = resolve(new URL("..", import.meta.url).pathname);
const temp = mkdtempSync(resolve(tmpdir(), "gzw-data-client-published-"));

try {
  execFileSync("npm", ["init", "-y"], { cwd: temp, stdio: "ignore" });
  execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", `${packageName}@${version}`], {
    cwd: temp,
    stdio: "inherit",
  });

  const installedPackage = JSON.parse(readFileSync(resolve(temp, "node_modules/@zoniboy/gzw-data-client/package.json"), "utf8"));
  assert.equal(installedPackage.version, version);

  const packageEntry = resolve(temp, "node_modules/@zoniboy/gzw-data-client/dist/index.js");
  const { GzwDataClient } = await import(pathToFileURL(packageEntry).href);
  const client = new GzwDataClient({
    retries: 0,
    fetch: async () => new Response(JSON.stringify({ data: { ok: true, version: "4.4.0" } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  });

  assert.deepEqual(await client.health(), { ok: true, version: "4.4.0" });
  console.log(JSON.stringify({ packageName, version, install: "ok", import: "ok", apiCall: "ok", status: "ok" }, null, 2));
} finally {
  rmSync(temp, { recursive: true, force: true });
}
