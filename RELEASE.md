# Release checklist

Use this checklist for every npm release of `@zoniboy/gzw-data-client`.

- [ ] Confirm the intended version and update `package.json` and `package-lock.json`.
- [ ] Update `ROADMAP.md` and the GitHub release notes.
- [ ] Run `npm ci`.
- [ ] Run `npm run check`.
- [ ] Run `npm run contract:check` against the intended API environment.
- [ ] Run the read-only `npm run contract:live` check.
- [ ] Run API and scraper source tests; run `npm run integration:check` with both repository paths configured.
- [ ] Run `npm pack --dry-run` and inspect the file list.
- [ ] Run `npm run tarball:smoke` in a clean temporary project.
- [ ] Exercise the public import and one representative API call.
- [ ] Review `git diff --check` and the final diff for secrets or unrelated files.
- [ ] Push GitHub changes before publishing.
- [ ] Publish the exact version with npm.
- [ ] Verify the exact version with `npm view` and a clean install from the registry.

## Automated release workflow

Pushing an annotated tag matching `v*.*.*` starts `.github/workflows/release.yml`.
The workflow validates that the tag matches `package.json`, runs the complete
local and live contract checks, inspects and smoke-tests the tarball, publishes
the exact package to npm with provenance, and creates the matching GitHub
release. If the exact version is already present on npm, the workflow skips a
second immutable publish and still runs the registry smoke test and creates the
GitHub release.

The workflow uses npm Trusted Publishing (GitHub Actions OIDC), so no long-lived
`NPM_TOKEN` secret is needed. A failed validation prevents publishing and
release creation.

## Live API data and generated autocomplete

Runtime dataset access is dynamic: `dataset(name)`, `dataset(name).info()`, and
`metadata()` fetch current records and metadata from the API. Newly added data
or fields do not require an SDK npm release. The generated dataset-name union
is only an autocomplete snapshot; `generatedDatasetInfo` is a static metadata
export. Neither is the runtime source of truth.

A weekly `refresh-generated-types.yml` workflow compares the live API metadata with the snapshot and opens a pull request only when dataset names, fields or field types changed (record counts are ignored). Merge it when convenient and release in a batch; it never publishes to npm.

The weekly `verify-api-compatibility.yml` workflow checks the live API and
scraper contracts without regenerating files, modifying `main`, or publishing
npm packages. Run `npm run generate-types` manually only when intentionally
refreshing autocomplete suggestions as part of an SDK release. Use
`gzw.metadata()` or `gzw.dataset(name).info()` when an application needs current
metadata.

The published-package check can also be run manually after propagation:

```bash
npm run published:smoke -- 0.9.0
```

Both smoke scripts (`tarball:smoke`, `published:smoke`) run npm through `scripts/npm.mjs`, which works on Windows (npm is a `.cmd` shim there) and ignores a user-level npm 12 `allow-scripts` setting that would otherwise fail every project install with `EALLOWSCRIPTS`.
