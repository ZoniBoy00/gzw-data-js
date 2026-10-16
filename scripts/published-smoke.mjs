#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
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
  const installArgs = ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--prefer-online", `${packageName}@${version}`];
  let installed = false;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const output = execFileSync("npm", installArgs, { cwd: temp, encoding: "utf8" });
      process.stdout.write(output);
      installed = true;
      break;
    } catch (error) {
      const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
      if (!/\b(?:E404|ETARGET)\b/.test(output) || attempt === 12) {
        process.stderr.write(output);
        throw error;
      }
      console.log(`npm registry propagation check ${attempt}/12: ${packageName}@${version} is not visible yet`);
      await delay(10_000);
    }
  }
  assert.equal(installed, true, `npm install did not complete for ${packageName}@${version}`);

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
