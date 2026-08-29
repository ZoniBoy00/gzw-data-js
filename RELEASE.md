# Release checklist

Use this checklist for every npm release of `@zoniboy/gzw-data-client`.

- [ ] Confirm the intended version and update `package.json` and `package-lock.json`.
- [ ] Update `CHANGELOG.md` and `ROADMAP.md`.
- [ ] Run `npm ci`.
- [ ] Run `npm run check`.
- [ ] Run `npm run check:generated`.
- [ ] Run the read-only `npm run contract:live` check.
- [ ] Run `npm pack --dry-run` and inspect the file list.
- [ ] Install the packed tarball into a clean temporary project.
- [ ] Exercise the public import and one representative API call.
- [ ] Review `git diff --check` and the final diff for secrets or unrelated files.
- [ ] Push GitHub changes before publishing.
- [ ] Publish the exact version with npm.
- [ ] Verify the exact version with `npm view` and a clean install from the registry.
