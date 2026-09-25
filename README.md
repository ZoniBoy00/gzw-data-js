# @zoniboy/gzw-data-client

[![npm version](https://img.shields.io/npm/v/%40zoniboy%2Fgzw-data-client?label=npm)](https://www.npmjs.com/package/@zoniboy/gzw-data-client)
[![CI](https://github.com/ZoniBoy00/gzw-data-js/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoniBoy00/gzw-data-js/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/ZoniBoy00/gzw-data-js)](https://github.com/ZoniBoy00/gzw-data-js/blob/main/LICENSE)

A zero-dependency, typed JavaScript/TypeScript client for the free [Gray Zone Warfare API](https://gzw-data.dev/). Build weapons databases, mission trackers, loot tools, Discord bots and dashboards without managing an API key.

- Node.js 18+ and modern browsers
- TypeScript declarations included
- Abortable requests and async pagination
- Retry handling for rate limits, server errors and transient network failures
- Typed dataset lookups with a compatible `get(id)` helper
- Bounded dataset exports through `dataset.export()`
- Typed batch loading with bounded concurrency through `dataset.getMany()`
- Optional process-local in-memory caching with TTL, invalidation and in-flight deduplication
- OpenAPI, health/readiness, stats, image and cross-dataset search helpers
- Typed metadata, schema, version and snapshot-change helpers
- Typed stable smart-route helpers for armor, weapon parts and helmet mods
- Generated autocomplete for published dataset names with a dynamic fallback for new datasets
- API data refreshed by the public scraper workflow

## Changelog

### 0.6.2 — cache invalidation and behavior documentation (September 2026)

- `clearCache(path)` now clears all cached query variants for that path without matching longer paths.
- Documented in-flight deduplication and AbortSignal behavior, iterator `maxPages`, and export count limits.

### 0.6.1 — non-JSON HTTP error handling (September 2026)

- Classify non-JSON 429 and 5xx responses from their HTTP status.
- Preserve `Retry-After` and rate-limit error metadata for non-JSON 429 responses.
- Keep malformed JSON on successful responses classified as `INVALID_RESPONSE`.

### 0.6.0 — API contracts and ecosystem integration (September 2026)

- Added typed readiness, dataset schema, and snapshot-change helpers.
- Added scoped/fuzzy search options while preserving the existing positional `AbortSignal` call.
- Tightened metadata, health, OpenAPI, version, and smart-route response types.
- Added source-to-API-to-SDK integration checks and CI coverage across the API and scraper repositories.
- Expanded Node.js/TypeScript, browser, and Discord bot documentation.

## Install

```bash
npm install @zoniboy/gzw-data-client
```

No API key is required.

## Quick start

```ts
import { GzwDataClient } from "@zoniboy/gzw-data-client";

const gzw = new GzwDataClient();

const weapons = await gzw.dataset("weapons").list({
  page: 1,
  perPage: 20,
});

console.log(weapons.data);
console.log(`${weapons.total} total weapons`);
```

## Dataset operations

Datasets are auto-discovered by the API, so new wiki categories are available without a client release. Filters are scoped to the dataset resource they are called on:

```ts
const weapons = gzw.dataset("weapons");

await weapons.list();
await weapons.list({ page: 2, perPage: 25 });
await weapons.search("AK-74");
await weapons.filter({ caliber: "5.45x39mm" });

const keys = gzw.dataset("keys");
await keys.filter({ type: "Keycard" }, { all: true });

// Fetch one record through the dedicated API route.
const item = await weapons.get("ak-74");

// Download a bounded server-side JSON export.
const exportResult = await weapons.export({ search: "AK", limit: 25 });

// Load multiple records with at most four requests in flight.
const records = await weapons.getMany(["ak-74", "ak-12"], { concurrency: 4 });
```

`get(id)` calls `/api/v1/<dataset>/<id>` directly. A missing record returns `undefined`, while other API errors are exposed as `GzwApiError` instances.

`dataset.export({ limit })` requests a bounded export, but the API controls its own maximum: `export.maxRecords` reports the server-side cap, not necessarily the requested `limit`. `export.count` reports the number of records returned for that request.

### Async iteration

Iterate through all pages without manually managing pagination:

```ts
for await (const weapon of gzw.dataset("weapons").iterate({ perPage: 50 })) {
  console.log(weapon.name);
}
```

The iterator stops at `totalPages`, an empty page, or an incomplete page. If it reaches the configurable `maxPages` safety limit before completion, it throws a `RangeError` rather than silently returning partial data. Pass an `AbortSignal` as the second argument to cancel it:

```ts
const controller = new AbortController();
const iterator = gzw.dataset("tasks").iterate({ perPage: 100 }, controller.signal);
controller.abort();
```

Known datasets receive stable TypeScript models while scraper-dependent fields remain optional. Unknown or newly discovered datasets continue to use the extensible `GzwRecord` fallback:

```ts
const weapons = gzw.dataset("weapons");
const response = await weapons.list();
const first = response.data[0];

first.caliber;          // string | undefined
first.fire_rate;        // string | undefined
first.future_wiki_field; // unknown
```

Use `GzwDataset` for dataset names with autocomplete for known datasets while still accepting new string names. Use `DatasetRecord<Name>` when building typed adapters around a dataset name.

You can also provide a project-specific record type:

```ts
import { GzwRecord } from "@zoniboy/gzw-data-client";

type CustomWeapon = GzwRecord & {
  caliber?: string;
  fire_rate?: string;
};

const customWeapons = gzw.dataset<CustomWeapon>("weapons").list();
```


## API helpers

```ts
const stats = await gzw.stats();
const health = await gzw.health();
const ready = await gzw.ready();
const api = await gzw.endpoints();
const version = await gzw.version();
const fullMetadata = await gzw.metadata();
const weaponMetadata = await gzw.metadata("weapons");
const weaponSchema = await gzw.schema("weapons");
const changes = await gzw.changes();
const images = await gzw.images();
const matches = await gzw.search("Mosin", {
  datasets: ["weapons"],
  fields: ["name"],
  fuzzy: true,
  limit: 5,
});
const openApi = await gzw.spec();
```

`gzw.search(query, options, signal)` supports dataset and field scoping, fuzzy matching, and a result limit. The earlier `gzw.search(query, signal)` form remains supported.

`gzw.metadata()` returns the full registry with field types, optionality, nullability, examples, and capabilities. `gzw.metadata(dataset)` and `gzw.dataset(dataset).info()` return detailed metadata for one dataset; `gzw.schema(dataset)` returns the API's machine-readable schema metadata.

## Browser apps

Use the package through a browser bundler such as Vite. The SDK uses the browser's native `fetch` and does not require an API key:

```ts
import { GzwDataClient } from "@zoniboy/gzw-data-client";

const gzw = new GzwDataClient();
const result = await gzw.search("AK-12", { datasets: ["weapons"], limit: 5 });

for (const weapon of result.results.weapons ?? []) {
  console.log(weapon.name, weapon.id);
}
```

Keep API calls bounded in user-facing views by setting `limit` or using dataset pagination. For long-running requests, pass an `AbortSignal` and abort it when the view is disposed.

## Discord bots

Use Discord.js for commands and embeds while the SDK handles API requests and typed errors. Defer the interaction before awaiting the API:

```ts
import { GzwDataClient, GzwApiError } from "@zoniboy/gzw-data-client";
import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";

const gzw = new GzwDataClient();

async function replyWithWeapon(interaction: ChatInputCommandInteraction, id: string) {
  await interaction.deferReply();
  try {
    const weapon = await gzw.dataset("weapons").get(id);
    if (!weapon) return interaction.editReply(`No weapon found for ID: ${id}`);

    const embed = new EmbedBuilder()
      .setTitle(weapon.name ?? weapon.id ?? "Weapon")
      .setDescription(`Caliber: ${weapon.caliber ?? "unknown"}`)
      .setColor(0xd9775f);
    return interaction.editReply({ embeds: [embed] });
  } catch (error) {
    const detail = error instanceof GzwApiError ? error.code : "REQUEST_FAILED";
    return interaction.editReply(`Could not load GZW data (${detail}).`);
  }
}
```

The Discord bot token belongs in the bot's local secret store or environment—not in SDK configuration or messages sent to the GZW API. A complete Discord.js example is also maintained in the [GZW Data API repository](https://github.com/ZoniBoy00/gzw-data/tree/main/examples/discord-bot).

## Configuration

```ts
const gzw = new GzwDataClient({
  baseUrl: "https://gzw-data.dev/api/v1",
  retries: 2,
  retryDelayMs: 250,
  maxRetryDelayMs: 30_000,
  cache: {
    ttlMs: 30_000,
    maxEntries: 100,
  },
  onRequest: ({ attempt, url }) => {
    console.log("request", attempt, url);
  },
  onResponse: ({ status, ok, url }) => {
    console.log("response", status, ok, url);
  },
  onRetry: ({ attempt, delayMs, status, url }) => {
    console.log(`Retry ${attempt} in ${delayMs}ms`, status, url);
  },
  headers: {
    "X-Client-Name": "my-gzw-tool",
  },
});
```

`cache` is disabled by default (`ttlMs: 0`). When enabled, only successful GET responses are cached. Cache keys include the complete request URL and query string, the cache is process-local and memory-only, and it is not a persistent storage layer. `clearCache("/weapons")` invalidates that path and all of its query variants; passing a path with a query string invalidates only that exact URL. Calling `clearCache()` clears the complete cache. Concurrent requests for the same URL share one in-flight request; its network request is controlled by the first caller's `AbortSignal`, and later callers cannot cancel their wait independently.

`dataset.getMany(ids, { concurrency })` loads records in input order while bounding the number of concurrent requests. It uses the same retry, cache, deduplication and cancellation behavior as individual requests.

For tests or server-side adapters, inject a custom fetch implementation:

```ts
const gzw = new GzwDataClient({ fetch: mockedFetch });
```

All methods accept an optional `AbortSignal` as their final argument:

```ts
const controller = new AbortController();
const request = gzw.dataset("tasks").list({}, controller.signal);
controller.abort();
await request;
```

Dataset responses expose `dataVersion` when the API has scraper metadata available. It identifies the data snapshot used for the response and is separate from the response-time `timestamp`.

## Metadata and version helpers

```ts
const metadata = await gzw.metadata("weapons");
const version = await gzw.version();
const weapons = await gzw.dataset("weapons").info();
```

The generated `KnownGzwDataset` names provide autocomplete for the datasets published by the API at generation time. `GzwDataset` still accepts arbitrary strings so newly discovered scraper datasets remain usable before the next SDK release.

Stable smart routes have typed convenience methods:

```ts
const armor = await gzw.armor();
const parts = await gzw.weaponParts();
const helmetMods = await gzw.helmetMods();
```

Regenerate dataset names and metadata with `npm run generate-types`. CI uses `npm run check:generated` to detect stale generated output.

## Errors and retries

The client retries rate-limited responses and server/network/invalid-response failures. Retry delays use exponential backoff, respect `Retry-After`, and are capped by `maxRetryDelayMs`. Aborted requests are never retried. Other HTTP failures throw `GzwApiError`:

```ts
import { GzwApiError } from "@zoniboy/gzw-data-client";

try {
  await gzw.dataset("weapons").list();
} catch (error) {
  if (error instanceof GzwApiError) {
    console.error(error.status, error.code, error.requestUrl);
    console.error(error.isRateLimited, error.isServerError);
  }
}
```

`GzwApiError` exposes the request URL, method, status text, safe response details, stable error code, and parsed `Retry-After` value. API errors use codes such as `RECORD_NOT_FOUND`, `DATASET_NOT_FOUND`, `INVALID_REQUEST`, and `RATE_LIMITED`; the complete error payload is available through `error.details`. Use `onRequest`, `onResponse`, and `onRetry` for observability without logging response bodies.

The runtime package has **zero dependencies**. TypeScript, `tsx` and Node types are development-only dependencies.

## Development

```bash
npm install
npm run check
npm run check:generated
npm run contract:check
npm run live:smoke
npm run contract:live
GZW_DATA_REPO=../gzw-data GZW_SCRAPER_REPO=../gzw-scraper npm run integration:check
npm run tarball:smoke
```

`npm run check` builds declaration files and runs the mocked HTTP test suite. `npm run live:smoke` performs a small health/data verification against the production API. `npm run contract:live` checks the API–SDK response contract; `npm run integration:check` checks the scraper-generated data against API metadata, then verifies the live API, OpenAPI schemas, and generated SDK field declarations together. The local live checks are opt-in; the dedicated CI integration job runs the source and production contract checks on pushes and pull requests.

The API/SDK compatibility boundary is documented in [docs/API-SDK-COMPATIBILITY.md](./docs/API-SDK-COMPATIBILITY.md). Use `npm run contract:check` for the release-gate response-shape checks and `npm run tarball:smoke` to install and exercise the packed package in a clean temporary project.

## Roadmap

The planned SDK improvements are tracked in [ROADMAP.md](./ROADMAP.md), including release automation, framework integrations and the path to `1.0.0`.

## Related links

- [GZW Data Console](https://gzw-data.dev/)
- [API Quick start](https://gzw-data.dev/docs/#quickstart)
- [GZW Data API](https://gzw-data.dev/api)
- [GZW Data repository](https://github.com/ZoniBoy00/gzw-data)

## License

MIT
