import { GzwDataClient } from "../src/index.js";

const client = new GzwDataClient({ retries: 1, retryDelayMs: 250, maxRetryDelayMs: 5_000 });
const health = await client.health();
if (!health.ok) throw new Error("GZW Data API health check returned ok=false");

const stats = await client.stats();
if (Object.keys(stats).length === 0) throw new Error("GZW Data API returned no dataset statistics");

const endpoints = await client.endpoints();
if (!Array.isArray(endpoints.endpoints)) throw new Error("GZW Data API returned invalid endpoint metadata");

const weapons = await client.dataset("weapons").list({ page: 1, perPage: 1 });
if (!Array.isArray(weapons.data) || weapons.data.length > 1) throw new Error("GZW Data API returned invalid weapons pagination");

const firstWeapon = weapons.data[0];
if (firstWeapon?.id) {
  const fetched = await client.dataset("weapons").get(firstWeapon.id);
  if (!fetched || fetched.id !== firstWeapon.id) throw new Error("GZW Data API get() fallback returned the wrong record");
}

console.log(JSON.stringify({
  apiVersion: health.version,
  datasetCount: Object.keys(stats).length,
  endpointCount: endpoints.endpoints.length,
  weaponsTotal: weapons.total,
  status: "ok",
}, null, 2));
