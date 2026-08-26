# GZW Data Client Roadmap

This roadmap tracks the evolution of `@zoniboy/gzw-data-client`, the zero-dependency JavaScript and TypeScript client for the GZW Data API.

The project favors a small, browser-friendly core, stable contracts, generated types where they are reliable, and real verification against the production API. Features should be added without turning the client into a framework.

## Current status

- **Current release:** `0.2.0`
- **Package:** `@zoniboy/gzw-data-client`
- **Runtime:** Node.js 18+ and modern browsers
- **Runtime dependencies:** 0
- **Current test suite:** mocked HTTP tests plus live API verification
- **API authentication:** not required

## Guiding principles

- Keep the core client dependency-free.
- Preserve browser and Node.js compatibility.
- Prefer explicit, typed APIs over magic abstractions.
- Keep dynamically discovered datasets usable even when new wiki categories appear.
- Do not expose credentials or require API keys that the API does not need.
- Make breaking changes only in a planned major release.
- Verify every release with mocked tests, build checks, package inspection, and live API checks.

## Phase 1 — `0.2.0`: stronger core client

### Pagination and retrieval

- [x] Add an async dataset iterator:
  ```ts
  for await (const weapon of gzw.dataset("weapons").iterate()) {
    console.log(weapon.name);
  }
  ```
- [x] Support configurable iterator page size.
- [x] Support cancellation with `AbortSignal` during iteration.
- [x] Define behavior for empty datasets and incomplete pages.
- [x] Improve `get(id)` semantics and document the current API-compatible ID-filter behavior.
- [x] Add a proper single-record API route in `gzw-data` when the server contract supports it.
- [x] Update the SDK `get(id)` implementation to use the single-record route without breaking the fallback behavior.

### Errors, retries, and observability

- [x] Add `requestUrl` to `GzwApiError`.
- [x] Add `method`, `statusText`, and safe response metadata to `GzwApiError`.
- [x] Add `isRateLimited` and `isServerError` convenience properties.
- [x] Add stable error codes for network, abort, HTTP, rate-limit, and invalid-response failures.
- [x] Add an `onRetry` callback with attempt, status, delay, and URL metadata.
- [x] Add optional debug hooks without logging response data by default.
- [x] Preserve `Retry-After` handling and cap retry delays.
- [x] Ensure aborted requests are never retried.

### Reliability and tests

- [x] Add tests for network failures and aborted requests.
- [x] Add tests for malformed JSON and malformed API envelopes.
- [x] Add tests for retry delay caps and `Retry-After` parsing.
- [x] Add tests for iterator cancellation, pagination boundaries, and empty results.
- [x] Keep the complete check gate green: build, tests, package contents, and live API smoke tests.

## Phase 2 — `0.3.0`: typed datasets and ergonomics

### Dataset-specific TypeScript types

- [x] Define stable shared types for common records and fields.
- [x] Add typed models for high-value datasets such as weapons, ammunition, armor, tasks, keys, medical, and provisions.
- [x] Keep unknown scraper fields available through an extensible record shape.
- [x] Document which fields are guaranteed and which are optional or scraper-dependent.
- [x] Add type tests so public declaration files are checked as part of CI.

### API type generation

- [ ] Add a `generate-types` command based on the API OpenAPI specification and live dataset metadata.
- [ ] Generate endpoint and dataset metadata into a separate generated source file.
- [ ] Keep generated types reviewable and deterministic.
- [ ] Avoid making package releases mandatory for every newly discovered dataset.
- [ ] Add a CI check that detects stale generated output.
- [ ] Document the difference between generated stable types and dynamic `GzwRecord` data.

### Convenience APIs

- [ ] Add typed convenience accessors for common datasets:
  ```ts
  gzw.weapons.list();
  gzw.tasks.list();
  gzw.keys.search("Fort Narith");
  gzw.medical.filter({ type: "Medical" });
  ```
- [ ] Implement convenience accessors on top of the same generic dataset resource.
- [ ] Avoid duplicating request logic for each dataset.
- [ ] Define a clear policy for newly discovered datasets that do not have a convenience accessor.
- [ ] Add typed smart-route helpers for armor and weapon parts where useful.

## Phase 3 — `0.4.0`: performance and composition

### Lightweight cache

- [ ] Add an optional in-memory cache with a small explicit interface:
  ```ts
  const gzw = new GzwDataClient({
    cache: { enabled: true, ttl: 300_000 },
  });
  ```
- [ ] Cache successful GET responses only.
- [ ] Include query parameters and relevant headers in the cache key.
- [ ] Add cache invalidation and clear methods.
- [ ] Never cache aborted or failed requests.
- [ ] Keep caching disabled by default to preserve current behavior.
- [ ] Document that cache is process-local and not a persistent data store.

### Batch and parallel loading

- [ ] Add a typed batch helper for multiple datasets.
- [ ] Add a parallel loader with per-dataset query options.
- [ ] Support partial failure reporting without hiding successful results.
- [ ] Add a concurrency limit to avoid unnecessary API bursts.
- [ ] Preserve one shared retry and cancellation policy across batch requests.
- [ ] Add examples for GZW Tools startup loading.

### Request efficiency

- [ ] Reuse response metadata where useful without exposing implementation details.
- [ ] Add optional request deduplication for identical in-flight GET requests.
- [ ] Add configurable maximum response size protection where supported by the runtime.
- [ ] Measure cache hit rate, deduplication, and batch behavior in tests rather than guessing.

## Phase 4 — `0.5.0`: framework integrations

### React integration

- [ ] Create a separate package: `@zoniboy/gzw-data-react`.
- [ ] Keep React out of the core package dependencies.
- [ ] Add `useGzwDataset` with loading, error, data, refetch, and cancellation states.
- [ ] Add `useGzwStats`, `useGzwHealth`, and `useGzwSearch` helpers where they prove useful.
- [ ] Support server-side rendering without global browser assumptions.
- [ ] Add examples for React, Vite, and Next.js.
- [ ] Test unmount cancellation and stale-request protection.

### Optional framework adapters

- [ ] Evaluate small adapters for other environments only after a real use case exists.
- [ ] Do not add framework-specific code to the core package.
- [ ] Keep each adapter independently versioned and dependency-scoped.

## Phase 5 — `0.6.0`: API contract and developer tooling

### Contract synchronization

- [ ] Add a documented API compatibility matrix between `gzw-data` and the client.
- [x] Validate the SDK against `/api/health`, `/api/stats`, `/api/search`, `/api/spec`, and representative datasets.
- [ ] Detect breaking response-shape changes before release.
- [x] Coordinate single-record routes and any new server-side query behavior with the API repository.
- [ ] Add release notes for API contract changes.

### Live verification

- [x] Add a separate `npm run contract:live` command.
- [ ] Run live tests against production only when explicitly requested or on a controlled schedule.
- [ ] Keep live checks small and rate-limit aware.
- [ ] Verify Node.js ESM import, browser bundling, and TypeScript declarations.
- [ ] Add package installation smoke tests from the published tarball.

### Developer experience

- [ ] Add API examples for JavaScript, TypeScript, Node.js, Vite, React, and Next.js.
- [ ] Add a changelog and release checklist.
- [ ] Add typed documentation generated from public declarations.
- [ ] Add a support policy for API versions and Node.js versions.
- [ ] Add issue templates for API bugs, type bugs, and feature requests.

## Phase 6 — `1.0.0`: stable public SDK

Release `1.0.0` only when:

- [ ] Core request, dataset, search, pagination, retry, and error APIs are stable.
- [ ] Public TypeScript declarations are reviewed and documented.
- [ ] API compatibility rules are written down.
- [ ] Browser and Node.js builds are verified.
- [ ] Published package installation is verified from npm.
- [ ] Changelog and migration guidance are available.
- [ ] Semver policy is adopted and followed.
- [ ] No known release-blocking bugs remain.

## Future ideas — evaluate later

These ideas are intentionally not committed to a release yet:

- [ ] Python client with the same API conventions.
- [ ] Offline snapshot support for applications that need local data.
- [ ] Optional schema validation for callers who want strict runtime checks.
- [ ] Typed image helpers and image URL normalization.
- [ ] Search ranking and richer cross-dataset search options.
- [ ] Cursor pagination if the API grows beyond practical page-based pagination.
- [ ] ETag or conditional-request support if the API exposes validators.
- [ ] A small CLI for inspecting datasets and testing API requests.

## Release checklist

Before every published version:

1. Run `npm run check`.
2. Run package-content inspection with `npm pack --dry-run`.
3. Run a controlled live API smoke test.
4. Verify the generated declaration files.
5. Check `git diff --check` and repository status.
6. Update README and changelog when public behavior changes.
7. Commit with an English message.
8. Push the source repository.
9. Publish the exact version to npm.
10. Install the published tarball in a clean temporary project and test the public import.
11. Verify the npm package page and version after publication.
