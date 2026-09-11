#!/usr/bin/env node

const baseUrl = (process.env.GZW_API_BASE_URL || "https://gzw-data.dev/api/v1").replace(/\/$/, "");

function fail(message) {
  throw new Error(`[contract] ${message}`);
}

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value;
}

function array(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

async function get(path, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`, { headers: { Accept: "application/json" } });
  if (response.status !== expectedStatus) fail(`${path} returned HTTP ${response.status}, expected ${expectedStatus}`);
  const body = await response.json();
  return { body, response };
}

const { body: health } = await get("/health");
const healthData = object(health.data, "/health.data");
if (healthData.ok !== true) fail("/health.data.ok must be true");
if (typeof healthData.apiVersion !== "string") fail("/health.data.apiVersion must be a string");

const { body: ready } = await get("/ready");
const readyData = object(ready.data, "/ready.data");
if (readyData.ready !== true) fail("/ready.data.ready must be true");
if (typeof readyData.datasetCount !== "number") fail("/ready.data.datasetCount must be a number");

const { body: version } = await get("/version");
const versionData = object(version.data, "/version.data");
for (const key of ["apiVersion", "implementationVersion", "dataVersion"]) {
  if (!(key in versionData)) fail(`/version.data.${key} is missing`);
}

const { body: stats } = await get("/stats");
const statsData = object(stats.data, "/stats.data");
const weaponStats = object(statsData.weapons, "/stats.data.weapons");
if (typeof weaponStats.total !== "number") fail("/stats.data.weapons.total must be a number");

const { body: metadata } = await get("/metadata?full=true");
const metadataData = object(metadata.data, "/metadata.data");
array(metadataData.datasets, "/metadata.data.datasets");
if (typeof metadataData.datasetCount !== "number") fail("/metadata.data.datasetCount must be a number");

const { body: listed } = await get("/weapons?page=1&per_page=1");
const listedData = array(listed.data, "/weapons.data");
if (typeof listed.page !== "number" || typeof listed.perPage !== "number") fail("/weapons pagination fields must be numbers");
if (typeof listed.total !== "number" || typeof listed.totalPages !== "number") fail("/weapons totals must be numbers");
if (listedData.length > listed.perPage) fail("/weapons.data exceeds perPage");

const { body: search } = await get("/search?q=AK");
const searchData = object(search.data, "/search.data");
if (searchData.query !== "AK") fail("/search.data.query must preserve the query");
object(searchData.results, "/search.data.results");

const { body: spec } = await get("/openapi.json");
if (!/^3\.\d+\.\d+$/.test(spec.openapi)) fail("OpenAPI version must be a valid 3.x semver");
object(spec.paths, "/openapi.paths");

const missing = await fetch(`${baseUrl}/weapons/__contract-test-record-does-not-exist__`, { headers: { Accept: "application/json" } });
if (missing.status !== 404) fail(`missing single record returned HTTP ${missing.status}, expected 404`);

console.log(JSON.stringify({
  baseUrl,
  checks: ["health", "ready", "version", "stats", "metadata", "pagination", "search", "openapi", "404"],
  dataset: "weapons",
  status: "ok",
}, null, 2));
