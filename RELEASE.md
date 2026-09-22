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

Before using the workflow, configure the repository secret `NPM_TOKEN` with a
publish-capable npm token. The workflow does not run for ordinary branch
pushes, and a failed validation prevents publishing and release creation.

The published-package check can also be run manually after propagation:

```bash
npm run published:smoke -- 0.5.0
```
