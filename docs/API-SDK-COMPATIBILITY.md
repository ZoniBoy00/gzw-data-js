# API / SDK compatibility matrix

This document describes the compatibility boundary between `@zoniboy/gzw-data-client` and the versioned GZW Data API.

## Supported contract

| API capability | API route | SDK surface | Contract status |
|---|---|---|---|
| API root | `GET /api/v1` | `client.apiRoot()` | Stable |
| Health | `GET /api/v1/health` | `client.health()` | Stable |
| Readiness | `GET /api/v1/ready` | `client.ready()` | Stable |
| Version | `GET /api/v1/version` | `client.version()` | Stable |
| Dataset metadata | `GET /api/v1/metadata` | `client.metadata()` and `dataset(name).info()` | Stable |
| Dataset schema | `GET /api/v1/metadata/:dataset/schema` | `dataset(name).schema()` | Stable |
| Dataset listing | `GET /api/v1/:dataset` | `dataset(name).list()` and `dataset(name).all()` | Stable |
| Single record | `GET /api/v1/:dataset/:id` | `dataset(name).get(id)` | Stable |
| Search | `GET /api/v1/search` | `client.search(query)` | Stable |
| Stats | `GET /api/v1/stats` | `client.stats()` | Stable |
| Changes | `GET /api/v1/changes` | `client.changes()` | Stable |
| Images | `GET /api/v1/images/:dataset/:id` | `client.image(dataset, id)` | Stable |
| OpenAPI | `GET /api/v1/openapi.json` | `client.spec()` | Stable |
| Bounded export | `GET /api/v1/:dataset/export` | `dataset(name).export(options)` | Stable |
| Stable smart routes | Dataset-specific routes | `client.smart.*` helpers | Stable only where listed below |

## Response rules

- Successful responses use the API's documented JSON envelope, except direct-array dataset responses, which the SDK also accepts for compatibility.
- Dataset list responses expose an array in `data` and may include `page`, `perPage`, `total`, and `totalPages`.
- The SDK preserves unknown dataset fields through the extensible `GzwRecord` fallback.
- A missing single record returns `undefined`; other HTTP errors throw `GzwApiError`.
- Error responses expose stable fields including status, error code, request URL, method, safe details, and parsed `Retry-After` when present.
- Rate-limited responses use HTTP `429` and error code `RATE_LIMITED`. The SDK may retry them when retries are enabled and must respect a capped `Retry-After` delay.

## Stable typed datasets

The generated declarations currently cover 85 discovered datasets. High-value stable models include weapons, ammunition, armor, tasks, keys, medical, and provisions. Newly discovered datasets remain available through `GzwRecord` without requiring an SDK release.

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
npm run check:generated
npm run contract:live
npm run tarball:smoke
```

The live checks are read-only and intentionally separate from the default local test suite.
