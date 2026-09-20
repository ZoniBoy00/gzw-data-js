# GZW Data Client Roadmap

This roadmap covers `@zoniboy/gzw-data-client`, the zero-dependency JavaScript/TypeScript client for the GZW Data API.

## Current status

- **Current release:** `0.5.0`
- **Runtime:** Node.js 18+ and modern browsers
- **Runtime dependencies:** 0
- **API default:** `https://gzw-data.dev/api/v1`
- **Tests:** 29 passing on 2026-09-20
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

### 1. API contract synchronization — `0.5.0`

- [x] Add a documented API/SDK compatibility matrix.
- [x] Add a separate 429 contract test.
- [x] Detect breaking response-shape changes before release.
- [x] Document health, readiness, version, schema, metadata, changes, and stats helpers.
- [x] Add release notes for public API contract changes.

### 2. Generated types

- [x] Add a deterministic `generate-types` command from OpenAPI and live metadata.
- [x] Generate known dataset names and endpoint metadata into reviewable source.
- [x] Add a CI check for stale generated output.
- [x] Keep dynamic datasets usable without requiring an SDK release.
- [x] Keep generated stable types separate from the extensible fallback type.

### 3. Convenience APIs

- [ ] Add typed convenience accessors only for high-value datasets.
- [x] Add `metadata()` and `dataset().info()` helpers.
- [x] Add typed smart-route helpers only when their server contracts are stable.
- [ ] Do not duplicate request logic for each dataset.

### 4. Performance and composition

- [x] Add optional in-memory GET caching with an explicit TTL.
- [x] Cache only successful requests and keep caching disabled by default.
- [x] Add cache invalidation and clear methods.
- [x] Add typed batch loading with bounded concurrency.
- [x] Add optional in-flight request deduplication.
- [x] Preserve shared retry and cancellation behavior for batch requests.

### 5. Future framework integrations — `1.0.0`

- [ ] Consider a separate `@zoniboy/gzw-data-react` package only when a real consumer needs it.
- [ ] Keep framework dependencies out of the core package.
- [ ] Add examples for Vite, React, Next.js, Python consumers, and Node CLI usage.

### 6. Release and maintenance

- [x] Add release notes guidance and a release checklist to the repository.
- [x] Define and document semantic versioning.
- [x] Add a CI tarball smoke test for the packed package.
- [x] Add a published-package installation smoke command.
- [ ] Add release automation: tag, CI, package inspection, npm publish, and GitHub release.
- [x] Add published-package installation smoke tests.
- [ ] Add SDK version information to a safe client header if the API has a documented use for it.

### Version targets

The SDK follows semantic versioning. The version targets are milestones, not promises to publish a release without a verified need.

#### `0.4.x` — performance and composition line

- Stable generic dataset access.
- Stable pagination, iteration, retries, cancellation, and typed errors.
- Versioned `/api/v1` default.
- Zero runtime dependencies.
- Backward-compatible fixes and small additions only.

The current release is `0.5.0`; `0.4.x` is maintained as the previous compatible line.

#### `0.3.0` — typed datasets and ergonomics

- [x] Stable shared types for high-value datasets.
- [x] Typed models for weapons, ammunition, armor, tasks, keys, medical, and provisions.
- [x] Extensible fallback type for unknown scraper fields and newly discovered datasets.
- [x] Type tests for public declaration behavior.
- [x] Add deterministic `generate-types` from OpenAPI and live metadata.
- [x] Generate known dataset names and endpoint metadata into reviewable source.
- [x] Keep generated stable types separate from dynamic `GzwRecord` data.
- [x] Add typed helpers for stable high-value smart routes.

#### `0.4.0` — performance and composition

- [x] Add optional in-memory GET caching with an explicit TTL.
- [x] Cache successful requests only and never cache aborted or failed requests.
- [x] Include query parameters in cache keys.
- [x] Add cache invalidation and clear methods.
- [x] Document that the cache is process-local and not persistent storage.
- [x] Add typed batch loading with bounded concurrency.
- [x] Add optional in-flight request deduplication.
- [x] Test cache hits, invalidation, deduplication, cancellation, and batch behavior.

#### `0.5.0` — contract and developer tooling milestone

- [x] API/SDK compatibility matrix.
- [x] Codegen-ready OpenAPI responses.
- [x] Deterministic generated dataset-name and type output.
- [x] Metadata and schema helpers.
- [x] Stronger contract tests for errors, pagination, search, and rate limits.
- [x] Release notes for public contract changes.

React and other framework adapters are intentionally deferred until the stable `1.0.0` line.

#### `0.6.0` — release readiness and ecosystem integration

- [ ] Release automation validates the package version, runs CI, publishes to npm, and creates a GitHub release.
- [ ] Published-package installation smoke tests run against the npm registry.
- [ ] API/SDK compatibility matrix is published and maintained.
- [ ] Metadata, schema, stats, health, readiness, changes, search, and smart-route helpers have consistent typed contracts.
- [ ] Cross-repository integration checks cover scraper output, API metadata, OpenAPI, and SDK declarations.
- [ ] Documentation and examples cover the main Node.js, browser, TypeScript, and bot use cases.

#### `0.7.0` — production hardening and performance

- [ ] Optional client-side caching has explicit TTL, invalidation, and query-aware cache keys.
- [ ] Batch loading uses bounded concurrency and preserves cancellation/retry behavior.
- [ ] In-flight request deduplication is tested if implemented.
- [ ] Rate-limit, retry, malformed-response, and cancellation behavior are covered by contract tests.
- [ ] Published-package smoke tests run from a clean temporary project.
- [ ] No runtime dependency is added to the core package without a documented reason.

#### `0.8.0` — release candidate and stability

- [ ] Public methods, types, response envelopes, and error semantics are frozen for the release candidate.
- [ ] Known breaking changes have migration notes.
- [ ] Generated types and declarations are deterministic and checked in CI.
- [ ] Release automation, release notes, semantic versioning, and package provenance are operational.
- [ ] Documentation is complete for installation, API compatibility, errors, retries, caching, and cancellation.
- [ ] A release-candidate package passes local, contract, and published-tarball checks.

#### `1.0.0` — stable public SDK and framework integrations

Publish `1.0.0` only when the public client contract is intentionally stable and documented:

- [ ] Breaking-change policy is documented.
- [ ] API response envelopes and error codes are covered by contract tests.
- [ ] Generated output is deterministic and checked in CI.
- [ ] Release automation and release notes workflow are in place.
- [ ] Published-package smoke tests pass.
- [ ] A migration guide exists for any known breaking changes.
- [ ] Create a separate `@zoniboy/gzw-data-react` package without adding React to core dependencies.
- [ ] Add `useGzwDataset` with loading, error, data, refetch, cancellation, and stale-request states.
- [ ] Add useful stats, health, and search hooks only after real consumers need them.
- [ ] Support server-side rendering without global browser assumptions.
- [ ] Add React, Vite, and Next.js examples plus unmount-cancellation tests.
- [ ] Evaluate other framework adapters only after a real use case exists.

### Semantic versioning policy

- **Patch:** bug fixes, documentation, test improvements, and internal changes with no public behavior break.
- **Minor:** backward-compatible methods, optional fields, helpers, and supported dataset types.
- **Major:** removed or renamed public methods, changed return semantics, incompatible error behavior, or other breaking client changes.
- Newly discovered datasets should remain available through the dynamic fallback without forcing a release.

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
4. Update the GitHub release notes and version according to semver.
5. Publish only from a clean reviewed branch.
6. Install the published tarball in a clean temporary project.
7. Verify the npm version and public import.

## Design constraints

- Keep the runtime package dependency-free.
- Use `/api/v1` in all new examples.
- Do not hide non-record API errors as `undefined`.
- Do not duplicate the entire API dataset inside the SDK.
- Do not require a client release for every newly discovered scraper dataset.
