# Contributing to @zoniboy/gzw-data-client

Thanks for helping improve the GZW Data JavaScript/TypeScript client.

## Repository scope

`gzw-data-js` is the zero-dependency SDK for the GZW Data API.

It contains:

- Typed dataset clients
- Pagination and async iteration helpers
- Search, metadata, schema, health, stats, image, and context helpers
- Runtime API error handling
- TypeScript declarations generated into `dist/`

API and scraper changes belong in the separate `gzw-data` and `gzw-scraper` repositories.

## Requirements

- Node.js 18 or newer
- npm
- TypeScript and test dependencies installed with `npm install`

Install dependencies:

```bash
npm install
```

The SDK core must remain zero-dependency at runtime. Development dependencies are allowed for builds and tests.

## Developing the SDK

When adding or changing an SDK method:

1. Use the versioned API base `/api/v1`.
2. Keep request and response behavior consistent with the API contract.
3. Preserve typed known datasets and the extensible `GzwRecord` fallback for newly discovered datasets.
4. Do not turn a server error into `undefined`.
5. Return `undefined` only for the documented missing-record case.
6. Preserve abortable requests and pagination behavior.
7. Add tests for success, malformed responses where relevant, and API error behavior.
8. Update README examples and declarations when public behavior changes.

The client should not duplicate the full API dataset locally. The API remains the source of truth.

## API compatibility

New integrations should use:

```text
https://gzw-data.dev/api/v1
```

Do not add new examples using the legacy `/api` prefix.

When an API response changes, verify:

- List responses
- Single-record responses
- Pagination envelopes
- Error envelopes
- Metadata and schema responses
- Search and stats helpers

## Tests and checks

Run the full local check before opening a pull request:

```bash
npm run check
```

This runs:

```bash
npm run build
npm run typecheck
npm test
```

You can also run the individual checks:

```bash
npm run build
npm run typecheck
npm test
```

Live checks are opt-in and must be read-only:

```bash
npm run live:smoke
npm run contract:live
```

Do not put API keys or other credentials in command output, test fixtures, or commits.

## Types and generated output

Keep generated declaration output consistent with the TypeScript source. If a change affects public types:

1. Update the source types.
2. Update or add type tests.
3. Run `npm run build`.
4. Review the generated `dist/` changes.
5. Run `npm run check`.

Do not add a required client release for every newly discovered scraper dataset. Unknown datasets must continue to work through the extensible fallback type.

## Pull requests

A pull request should include:

- The API method or type changed
- Why the change is needed
- Compatibility impact
- Tests run and their real results
- README or documentation changes
- Any required API-side change

Keep API behavior changes and SDK refactors separate where possible.

## Releasing a version

Only publish from a clean, reviewed main branch or an approved release branch.

Before changing the version:

```bash
git status --short
npm run check
npm pack --dry-run
```

Update the version using npm's semver tooling:

```bash
npm version patch
# or: npm version minor
# or: npm version major
```

Then rerun the complete check and inspect the generated package contents:

```bash
npm run check
npm pack --dry-run
```

For a public release, publish the package with the intended access setting:

```bash
npm publish --access public
```

Publishing requires an authenticated npm account or trusted CI publishing configuration. Never place an npm token in the repository, a command committed to documentation, or a public log.

After publishing:

1. Verify the version on npm.
2. Install the published version in a clean temporary project.
3. Run a minimal import and API-client smoke test.
4. Create or update the GitHub release and changelog.
5. Confirm the package contains only the intended `dist`, README, and license files.

## Commits

Use concise conventional-style subjects, for example:

```text
feat: add metadata helper
fix: preserve API errors in get
chore: release 0.2.5
```

Use real line breaks in commit bodies. Do not use literal `\\n` escape sequences in commit messages or documentation examples.
