# API / SDK compatibility matrix

This document describes the compatibility boundary between `@zoniboy/gzw-data-client` and the versioned GZW Data API. The user-facing [SDK guide](https://gzw-data.dev/docs/sdk/) contains installation, runtime dataset discovery, examples, and troubleshooting. Runnable TypeScript examples live in [`examples/sdk/`](../examples/sdk/) and are included in the type-check suite.

## Supported contract

This matrix lists methods implemented by the published SDK, not every endpoint exposed by the API. API routes below are relative to the configured base URL, which defaults to `https://gzw-data.dev/api/v1`.

| API capability | API route | SDK surface | Contract status |
|---|---|---|---|
| API root / endpoint listing | `GET /api/v1` | `client.endpoints()` | Stable |
| Health | `GET /api/v1/health` | `client.health()` | Stable |
| Readiness | `GET /api/v1/ready` | `client.ready()` | Stable |
| Version and data snapshot | `GET /api/v1/version` | `client.version()` | Stable |
| Dataset registry and detailed metadata | `GET /api/v1/metadata` and `GET /api/v1/metadata/:dataset` | `client.metadata()` and `dataset(name).info()` | Stable; full and per-dataset types distinguish summary fields from detailed field metadata |
| Machine-readable dataset schema | `GET /api/v1/schema/:dataset` | `client.schema(dataset)` | Stable |
| Dataset listing | `GET /api/v1/:dataset` | `dataset(name).list()`, `filter()`, `search()`, `iterate()` | Stable |
| Single record | `GET /api/v1/:dataset/:id` | `dataset(name).get(id)` | Stable |
| Cross-dataset search | `GET /api/v1/search` | `client.search(query, options?, signal?)` | Stable; supports dataset, field, fuzzy, and result-limit options |
| Stats | `GET /api/v1/stats` | `client.stats()` | Stable |
| Snapshot changes | `GET /api/v1/changes` | `client.changes()` | Stable |
| Images index | `GET /api/v1/images` | `client.images()` | Stable |
| OpenAPI specification | `GET /api/v1/spec` | `client.spec()` | Stable |
| Bounded dataset export | `GET /api/v1/export/:dataset` | `dataset(name).export(options)` | Stable |
| Dataset record batch loading | Repeated `GET /api/v1/:dataset/:id` | `dataset(name).getMany(ids)` | Client-side helper |
| Stable smart-route helpers | Dataset routes for `armor`, `weapon_parts`, and `helmet_mods` | `client.armor()`, `client.weaponParts()`, `client.helmetMods()` | Stable; typed record models |

## Response rules

- Successful responses use the API's documented JSON envelope, except direct-array dataset responses, which the SDK also accepts for compatibility.
- Dataset list responses expose an array in `data` and may include `page`, `perPage`, `total`, and `totalPages`.
- The SDK preserves unknown dataset fields through the extensible `GzwRecord` fallback.
- A missing single record returns `undefined`; other HTTP errors throw `GzwApiError`.
- Error responses expose stable fields including status, error code, request URL, method, safe details, and parsed `Retry-After` when present.
- Rate-limited responses use HTTP `429` and error code `RATE_LIMITED`. The SDK may retry them when retries are enabled and must respect a capped `Retry-After` delay.

## Stable typed datasets

The SDK keeps curated models for high-value stable datasets such as weapons, ammunition, armor, tasks, keys, medical, and provisions. All dataset names, metadata, and records are resolved from the API at runtime; newly discovered datasets remain available through the generic `GzwRecord` fallback without requiring an SDK release. The generated dataset-name union is an optional autocomplete snapshot, not the runtime registry.

## Smart-route policy

Smart-route helpers are added only for server routes with a stable API contract. A helper is not a promise that every newly discovered dataset receives a dedicated method. Generic dataset access remains the compatibility fallback.

## Compatibility policy

- API additions and new optional response fields are backward-compatible minor changes.
- Removing or renaming a public SDK method, changing missing-record semantics, changing stable error codes, or changing response envelopes is a breaking change.
- API contract changes must update this matrix, the live contract checks, and the SDK release notes before publication.
- The SDK default is always the versioned production base `https://gzw-data.dev/api/v1`.
- The core package remains runtime-dependency-free.

## Verification commands

```bash
npm run check
npm run contract:check
npm run contract:live
GZW_DATA_REPO=../gzw-data GZW_SCRAPER_REPO=../gzw-scraper npm run integration:check
npm run tarball:smoke
```

`integration:check` validates scraper metadata against the API repository's data manifest, checks live API metadata against OpenAPI, and exercises runtime dataset discovery through the SDK. It deliberately does not require the SDK's optional autocomplete snapshot to match every API data update. CI runs this integration path against the current public API and both source repositories.

The live checks are read-only and intentionally separate from the local unit-test command.
