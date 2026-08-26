# @zoniboy/gzw-data-client

[![npm version](https://img.shields.io/npm/v/%40zoniboy%2Fgzw-data-client?label=npm)](https://www.npmjs.com/package/@zoniboy/gzw-data-client)
[![CI](https://github.com/ZoniBoy00/gzw-data-js/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoniBoy00/gzw-data-js/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/ZoniBoy00/gzw-data-js)](https://github.com/ZoniBoy00/gzw-data-js/blob/main/LICENSE)

A zero-dependency, typed JavaScript/TypeScript client for the free [Gray Zone Warfare API](https://gzw-data.vercel.app/). Build weapons databases, mission trackers, loot tools, Discord bots and dashboards without managing an API key.

- Node.js 18+ and modern browsers
- TypeScript declarations included
- Abortable requests and async pagination
- Retry handling for rate limits, server errors and transient network failures
- Typed dataset lookups with a compatible `get(id)` helper
- OpenAPI, health, stats, image and cross-dataset search helpers
- API data refreshed by the public scraper workflow

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

Datasets are auto-discovered by the API, so new wiki categories are available without a client release.

```ts
const weapons = gzw.dataset("weapons");

await weapons.list();
await weapons.list({ page: 2, perPage: 25 });
await weapons.search("AK-74");
await weapons.filter({ caliber: "5.45x39mm" });
await weapons.filter({ type: "Keycard" }, { all: true });

// Fetch one record through the dedicated API route.
const item = await weapons.get("ak-74");
```

`get(id)` calls `/api/<dataset>/<id>` directly. A missing record returns `undefined`, while other API errors are exposed as `GzwApiError` instances.

### Async iteration

Iterate through all pages without manually managing pagination:

```ts
for await (const weapon of gzw.dataset("weapons").iterate({ perPage: 50 })) {
  console.log(weapon.name);
}
```

The iterator stops at `totalPages`, an empty page, or an incomplete page. Pass an `AbortSignal` as the second argument to cancel it:

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
const api = await gzw.endpoints();
const images = await gzw.images();
const matches = await gzw.search("Mosin");
const openApi = await gzw.spec();
```

`gzw.search()` returns the API's cross-dataset shape:

```ts
{
  query: "Mosin",
  results: {
    weapons: [/* matching records */]
  }
}
```

## Configuration

```ts
const gzw = new GzwDataClient({
  baseUrl: "https://gzw-data.vercel.app/api/v1",
  retries: 2,
  retryDelayMs: 250,
  maxRetryDelayMs: 30_000,
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
npm run live:smoke
npm run contract:live
```

`npm run check` builds declaration files and runs the mocked HTTP test suite. `npm run live:smoke` performs a small health/data verification against the production API. `npm run contract:live` performs the explicit API–SDK contract checks against production, including dataset listing, pagination, single-record lookup, search, stats, OpenAPI, and 404 behavior. The live checks are intentionally separate from the default CI run.

## Roadmap

The planned SDK improvements are tracked in [ROADMAP.md](./ROADMAP.md), including the next single-record route integration, generated dataset metadata, caching, batch loading, React integration, live contract tests and the path to `1.0.0`.

## Related links

- [GZW Data Console](https://gzw-data.vercel.app/)
- [API Quick start](https://gzw-data.vercel.app/docs/#quickstart)
- [GZW Data API](https://gzw-data.vercel.app/api)
- [GZW Data repository](https://github.com/ZoniBoy00/gzw-data)

## License

MIT
