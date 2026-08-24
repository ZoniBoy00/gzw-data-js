# @zoniboy00/gzw-data-client

Zero-dependency TypeScript client for the [GZW Data API](https://gzw-data.vercel.app/).

The client works in Node.js 18+ and modern browsers. It provides typed helpers for datasets, pagination, filters, cross-dataset search, API health, statistics, endpoint discovery and OpenAPI metadata.

## Install

```bash
npm install @zoniboy00/gzw-data-client
```

No API key is required.

## Quick start

```ts
import { GzwDataClient } from "@zoniboy00/gzw-data-client";

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

// Convenience lookup using the API's exact id filter.
const item = await weapons.get("ak-74");
```

Every record is typed as `GzwRecord` by default and keeps unknown wiki fields available:

```ts
const response = await gzw.dataset("weapons").list();
const first = response.data[0];
console.log(first.name, first.image);
```

You can provide a project-specific record type:

```ts
import { GzwRecord } from "@zoniboy00/gzw-data-client";

type Weapon = GzwRecord & {
  caliber?: string;
  fire_rate?: string;
};

const weapons = await gzw.dataset<Weapon>("weapons").list();
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
  baseUrl: "https://gzw-data.vercel.app/api",
  retries: 2,
  retryDelayMs: 250,
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

The client retries HTTP `429` and `5xx` responses. For `429`, it respects the API's `Retry-After` header. Other HTTP failures throw `GzwApiError`:

```ts
import { GzwApiError } from "@zoniboy00/gzw-data-client";

try {
  await gzw.dataset("weapons").list();
} catch (error) {
  if (error instanceof GzwApiError) {
    console.error(error.status, error.code, error.retryAfter);
  }
}
```

The runtime package has **zero dependencies**. TypeScript, `tsx` and Node types are development-only dependencies.

## Development

```bash
npm install
npm run check
```

`npm run check` builds declaration files and runs the mocked HTTP test suite.

## Related links

- [GZW Data Console](https://gzw-data.vercel.app/)
- [API Quick start](https://gzw-data.vercel.app/docs/#quickstart)
- [GZW Data API](https://gzw-data.vercel.app/api)
- [GZW Data repository](https://github.com/ZoniBoy00/gzw-data)

## License

MIT
