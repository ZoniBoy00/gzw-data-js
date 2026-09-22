import assert from "node:assert/strict";
import { GzwDataClient, generatedDatasetInfo } from "../dist/index.js";

const baseUrl = (process.env.GZW_API_URL ?? "https://gzw-data.dev/api/v1").replace(/\/+$/, "");
const client = new GzwDataClient({ baseUrl, retries: 0 });

const [health, ready, version, metadata, weaponMetadata, schema, stats, changes, spec] = await Promise.all([
  client.health(),
  client.ready(),
  client.version(),
  client.metadata(),
  client.metadata("weapons"),
  client.schema("weapons"),
  client.stats(),
  client.changes(),
  client.spec(),
]);

assert.equal(health.status, "ok", "health status must be ok");
assert.equal(ready.ready, true, "readiness probe must report ready");
assert.equal(version.apiVersion, "v1", "API version must match the SDK's versioned base");
assert.ok(metadata.datasetCount > 0, "full metadata must include datasets");
assert.ok(weaponMetadata.capabilities?.operations.includes("list"), "dataset metadata must expose capabilities");
assert.ok(Array.isArray(weaponMetadata.fields) || typeof weaponMetadata.fields === "object", "dataset metadata must expose fields");
assert.equal(schema.name, "weapons", "schema route must identify the requested dataset");
assert.ok(stats.weapons?.total > 0, "stats must include weapons");
assert.equal(typeof changes.hasHistory, "boolean", "changes must report snapshot availability");
assert.match(spec.openapi, /^3\.\d+\.\d+$/, "OpenAPI version must be valid");

const metadataByName = new Map(metadata.datasets.map((dataset) => [dataset.name, dataset]));
for (const [name, generated] of Object.entries(generatedDatasetInfo)) {
  const live = metadataByName.get(name);
  assert.ok(live, `generated SDK dataset ${name} must exist in API metadata`);
  assert.ok(live.fields && !Array.isArray(live.fields), `${name} metadata must expose typed fields`);
  const liveFields = live.fields;
  assert.deepEqual(Object.keys(generated.fields).sort(), Object.keys(liveFields).sort(), `${name} generated fields must match scraper metadata`);
  for (const [field, types] of Object.entries(generated.fields)) {
    assert.deepEqual(types, liveFields[field]?.types ?? [], `${name}.${field} generated types must match scraper metadata`);
  }
  const openApiSchema = spec.components?.schemas?.[name];
  assert.ok(openApiSchema, `OpenAPI must publish a schema for ${name}`);
  assert.deepEqual(Object.keys(openApiSchema.properties ?? {}).sort(), Object.keys(generated.fields).sort(), `${name} OpenAPI fields must match generated SDK metadata`);
}

const result = await client.search("AK-12", { datasets: ["weapons"], fields: ["name"], limit: 3 });
assert.equal(result.query, "AK-12");
assert.deepEqual(result.datasets, ["weapons"]);
assert.equal(result.limit, 3);
assert.ok(Object.hasOwn(result.results, "weapons"), "scoped search must include matching dataset results");

for (const path of ["/api/v1/ready", "/api/v1/changes", "/api/v1/schema/{dataset}", "/api/v1/search"]) {
  assert.ok(spec.paths[path], `OpenAPI must advertise ${path}`);
}

for (const [label, request] of [
  ["armor", () => client.armor()],
  ["weapon_parts", () => client.weaponParts()],
  ["helmet_mods", () => client.helmetMods()],
]) {
  const response = await request();
  assert.ok(Array.isArray(response.data), `${label} smart route must return a data array`);
}

console.log(JSON.stringify({
  status: "ok",
  baseUrl,
  apiVersion: version.apiVersion,
  dataVersion: version.dataVersion,
  datasets: metadata.datasetCount,
  generatedDatasetsChecked: Object.keys(generatedDatasetInfo).length,
  checks: ["health", "readiness", "version", "metadata", "schema", "stats", "changes", "OpenAPI", "search", "smart-routes"],
}, null, 2));
