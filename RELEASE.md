# Release checklist

Use this checklist for every npm release of `@zoniboy/gzw-data-client`.

- [ ] Confirm the intended version and update `package.json` and `package-lock.json`.
- [ ] Update `ROADMAP.md` and the GitHub release notes.
- [ ] Run `npm ci`.
- [ ] Run `npm run check`.
- [ ] Run `npm run check:generated`.
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

## Generated API metadata automation

`refresh-generated-metadata.yml` runs weekly after the scraper's scheduled run
and can also be started manually. It regenerates dataset names and field
metadata from the live API, validates the SDK against API and scraper sources,
and classifies the schema diff:

- Additions only: bump the patch version, update release notes, push the commit
  and tag, then dispatch this release workflow against that exact tag. The
  package is published only after all release checks pass.
- Removed datasets/fields or narrowed field types: create a review PR and do
  not bump or publish automatically.
- Record-count-only changes: discard the generated snapshot diff and do not
  release. `generatedDatasetInfo.count` is a package-release snapshot; live
  counts belong to the API.

The generated-output check compares dataset names and field schemas, not record
counts. This prevents routine scraper data changes from failing SDK CI or
producing unnecessary npm versions.

The published-package check can also be run manually after propagation:

```bash
npm run published:smoke -- 0.7.3
```
