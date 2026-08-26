import assert from "node:assert/strict";
import { GzwDataClient } from "../src/index.js";

const client = new GzwDataClient({
  retries: 0,
  baseUrl: "https://gzw-data.vercel.app/api/v1",
});

const stats = await client.stats();
assert.ok(stats.weapons && stats.weapons.total > 0, "stats must include weapons");

const listed = await client.dataset("weapons").list({ page: 1, perPage: 2 });
assert.ok(Array.isArray(listed.data), "dataset data must be an array");
assert.equal(listed.page, 1, "pagination must include the requested page");
assert.equal(listed.perPage, 2, "pagination must include the requested page size");
assert.ok(listed.total > 0, "pagination must include a positive total");
assert.ok(listed.totalPages > 0, "pagination must include totalPages");

const firstWeapon = listed.data[0];
assert.ok(firstWeapon?.id, "dataset records must expose an id");
const single = await client.dataset("weapons").get(firstWeapon.id);
assert.equal(single?.id, firstWeapon.id, "single-record route must return the requested record");

const search = await client.search("AK");
assert.equal(search.query, "AK");
assert.ok(search.results && typeof search.results === "object", "search must return results by dataset");

const spec = await client.spec();
assert.match(spec.openapi, /^3\.\d+\.\d+$/, "OpenAPI version must be a valid 3.x semver");
assert.ok(spec.paths && typeof spec.paths === "object", "OpenAPI spec must expose paths");

const missing = await client.dataset("weapons").get("__contract-test-record-does-not-exist__");
assert.equal(missing, undefined, "missing records must map to undefined");

console.log(JSON.stringify({
  checks: ["stats", "dataset", "pagination", "single-record", "search", "spec", "404"],
  dataset: "weapons",
  recordId: firstWeapon.id,
  status: "ok",
}, null, 2));
