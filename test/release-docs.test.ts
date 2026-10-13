import assert from "node:assert/strict";
import test from "node:test";
import { markReleasePublished, prepareReleaseDocs } from "../scripts/release-docs.mjs";

const readme = "# Package\n\n## Changelog\n\n### 0.7.3 — previous release (October 2026)\n";
const roadmap = [
  "# Roadmap",
  "## Current status",
  "- **Package version:** `0.7.3` (released)",
  "- **Latest published npm release:** `0.7.3`",
  "#### `0.8.0` — release candidate and stability",
  "",
].join("\n");

test("prepares changelog and roadmap for an additive metadata release", () => {
  const prepared = prepareReleaseDocs({ readme, roadmap, version: "0.7.4", date: "October 2026" });
  assert.match(prepared.readme, /### 0\.7\.4 — refreshed dataset metadata \(October 2026\)/);
  assert.match(prepared.roadmap, /\*\*Package version:\*\* `0\.7\.4` \(release candidate\)/);
  assert.match(prepared.roadmap, /\*\*Latest published npm release:\*\* `0\.7\.3`/);
  assert.ok(prepared.roadmap.indexOf("0.7.4") < prepared.roadmap.indexOf("0.8.0"));
});

test("marks a candidate released and advances the published version", () => {
  const prepared = prepareReleaseDocs({ readme, roadmap, version: "0.7.4", date: "October 2026" });
  const published = markReleasePublished(prepared.roadmap, "0.7.4");
  assert.match(published, /\*\*Package version:\*\* `0\.7\.4` \(released\)/);
  assert.match(published, /\*\*Latest published npm release:\*\* `0\.7\.4`/);
  assert.match(published, /0\.7\.4.*\(released\)/);
  assert.match(published, /verified SLSA provenance/);
});

test("refuses to prepare docs without the expected release anchors", () => {
  assert.throws(() => prepareReleaseDocs({ readme: "no changelog", roadmap, version: "0.7.4", date: "October 2026" }));
  assert.throws(() => prepareReleaseDocs({ readme, roadmap: "no release anchor", version: "0.7.4", date: "October 2026" }));
});
