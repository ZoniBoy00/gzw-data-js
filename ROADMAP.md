# GZW Data Client Roadmap

This roadmap covers `@zoniboy/gzw-data-client`, the zero-dependency JavaScript/TypeScript client for the GZW Data API.

## Current status

- **Current release:** `0.2.4`
- **Runtime:** Node.js 18+ and modern browsers
- **Runtime dependencies:** 0
- **API default:** `https://gzw-data.dev/api/v1`
- **Tests:** 22 passing on 2026-08-27
- **License:** MIT

## Completed

- [x] Typed generic dataset resources with extensible `GzwRecord` fallback.
- [x] Typed models for common datasets including weapons, ammunition, armor, tasks, keys, medical, and provisions.
- [x] Versioned production API default.
- [x] Pagination and async iteration.
- [x] AbortSignal cancellation.
- [x] Direct single-record route support.
- [x] Stable `GzwApiError` fields and error codes.
- [x] Retry handling for network errors, server errors, and rate limits.
- [x] Retry-After parsing and delay caps.
- [x] Optional safe debug hooks without response bodies.
- [x] Search, stats, health, images, OpenAPI, metadata, and API-root helpers.
- [x] Type tests and malformed-response tests.
- [x] Published package inspection and live contract smoke-test commands.
- [x] Zero runtime dependencies.
- [x] `CONTRIBUTING.md` with SDK development and npm release guidance.

## Next priorities

### 1. API contract synchronization

- [ ] Add a documented API/SDK compatibility matrix.
- [ ] Add a separate 429 contract test.
- [ ] Detect breaking response-shape changes before release.
- [ ] Document health, readiness, version, schema, metadata, changes, and stats helpers.
- [ ] Add release notes for public API contract changes.

### 2. Generated types

- [ ] Add a deterministic `generate-types` command from OpenAPI and live metadata.
- [ ] Generate known dataset names and endpoint metadata into reviewable source.
- [ ] Add a CI check for stale generated output.
- [ ] Keep dynamic datasets usable without requiring an SDK release.
- [ ] Keep generated stable types separate from the extensible fallback type.

### 3. Convenience APIs

- [ ] Add typed convenience accessors only for high-value datasets.
- [ ] Add `metadata()` and `dataset().info()` helpers.
- [ ] Add typed smart-route helpers only when their server contracts are stable.
- [ ] Do not duplicate request logic for each dataset.

### 4. Performance and composition

- [ ] Add optional in-memory GET caching with an explicit TTL.
- [ ] Cache only successful requests and keep caching disabled by default.
- [ ] Add cache invalidation and clear methods.
- [ ] Add typed batch loading with bounded concurrency.
- [ ] Add optional in-flight request deduplication.
- [ ] Preserve shared retry and cancellation behavior for batch requests.

### 5. Integrations

- [ ] Consider a separate `@zoniboy/gzw-data-react` package only when a real consumer needs it.
- [ ] Keep framework dependencies out of the core package.
- [ ] Add examples for Vite, React, Next.js, Python consumers, and Node CLI usage.

### 6. Release and maintenance

- [ ] Add a changelog and release checklist to the repository.
- [ ] Define and document semantic versioning.
- [ ] Add release automation: tag, CI, package inspection, npm publish, and GitHub release.
- [ ] Add published-tarball installation smoke tests.
- [ ] Add SDK version information to a safe client header if the API has a documented use for it.

## Release checklist

Before publishing a version:

```bash
npm run check
npm pack --dry-run
```

Then:

1. Review the public declarations.
2. Review package contents.
3. Run a controlled, read-only live smoke test.
4. Update the changelog and version according to semver.
5. Publish only from a clean reviewed branch.
6. Install the published tarball in a clean temporary project.
7. Verify the npm version and public import.

## Design constraints

- Keep the runtime package dependency-free.
- Use `/api/v1` in all new examples.
- Do not hide non-record API errors as `undefined`.
- Do not duplicate the entire API dataset inside the SDK.
- Do not require a client release for every newly discovered scraper dataset.
