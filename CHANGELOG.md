# Changelog

## 0.3.0 — 2026-08-29

- Added deterministic dataset type and endpoint metadata generation from the live API metadata.
- Added `npm run generate-types` and `npm run check:generated`.
- Added generated autocomplete for the published dataset names while retaining the extensible `GzwRecord` fallback.
- Added `client.metadata()` and `client.dataset(name).info()` helpers.
- Added `client.version()` with API, implementation, and data-version typing.
- Added typed helpers for the stable `armor`, `weapon_parts`, and `helmet_mods` smart routes.
- Added mocked coverage for metadata, version, and smart-route helpers.
- Added generated-output verification to CI.

## 0.2.4

- Added production contract smoke checks and hardened retries, aborts, malformed responses, pagination, and error handling.
