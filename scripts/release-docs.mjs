import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

function replaceOnce(text, search, replacement, label) {
  const index = text.indexOf(search);
  if (index < 0 || text.indexOf(search, index + search.length) >= 0) {
    throw new Error(`Expected exactly one ${label} anchor`);
  }
  return `${text.slice(0, index)}${replacement}${text.slice(index + search.length)}`;
}

export function prepareReleaseDocs({ readme, roadmap, version, date }) {
  const changelogAnchor = "## Changelog\n";
  if (readme.includes(`### ${version} —`)) throw new Error(`README already contains version ${version}`);
  const changelog = `${changelogAnchor}\n### ${version} — refreshed dataset metadata (${date})\n\n- Refresh generated dataset names, field metadata, and the published count snapshot.\n- Include additive dataset/schema updates; removals and type narrowing are routed for review.\n`;
  const preparedReadme = replaceOnce(readme, changelogAnchor, changelog, "README changelog");

  const packageLine = /^- \*\*Package version:\*\* `[^`]+` \([^\n]+\)$/m;
  const packageMatches = roadmap.match(packageLine) ?? [];
  if (packageMatches.length !== 1) throw new Error("Expected one roadmap package-version line");
  const preparedRoadmap = roadmap.replace(packageLine, `- **Package version:** \`${version}\` (release candidate)`);
  const anchor = "#### `0.8.0` — release candidate and stability\n";
  const section = `#### \`${version}\` — refreshed dataset metadata (release candidate)\n\n- [x] Regenerate additive dataset names and field metadata from the current API.\n- [x] Run package, generated-output, API contract, and source/live integration checks.\n- [ ] Publish with provenance and verify the exact npm artifact.\n\n`;
  return { readme: preparedReadme, roadmap: replaceOnce(preparedRoadmap, anchor, `${section}${anchor}`, "0.8.0 roadmap") };
}

export function markReleasePublished(roadmap, version) {
  const candidateHeading = `#### \`${version}\` — refreshed dataset metadata (release candidate)`;
  if (!roadmap.includes(candidateHeading)) return roadmap;

  let updated = replaceOnce(roadmap, `- **Package version:** \`${version}\` (release candidate)`, `- **Package version:** \`${version}\` (released)`, "release-candidate package version");
  updated = updated.replace(/^- \*\*Latest published npm release:\*\* `[^`]+`$/m, `- **Latest published npm release:** \`${version}\``);
  updated = replaceOnce(updated, candidateHeading, `#### \`${version}\` — refreshed dataset metadata (released)`, "release-candidate heading");
  updated = replaceOnce(updated, "- [ ] Publish with provenance and verify the exact npm artifact.", "- [x] Publish with provenance and verify the exact npm artifact.", "release publication checklist");

  const releaseUrl = `https://github.com/ZoniBoy00/gzw-data-js/releases/tag/v${version}`;
  const paragraph = `\nPublished npm \`${version}\` with verified SLSA provenance. The clean published-package install/import/API smoke test passed, and the release workflow completed successfully. See [GitHub release v${version}](${releaseUrl}).\n`;
  const nextSection = `\n#### \`0.8.0\` — release candidate and stability`;
  if (updated.includes(nextSection)) updated = replaceOnce(updated, nextSection, `${paragraph}${nextSection}`, "next roadmap milestone");
  else updated = `${updated.trimEnd()}\n${paragraph}`;
  return updated;
}

async function main() {
  const [, , mode, requestedVersion] = process.argv;
  if (mode === "prepare") {
    const manifest = JSON.parse(await readFile("package.json", "utf8"));
    const previous = JSON.parse(execFileSync("git", ["show", "HEAD:package.json"], { encoding: "utf8" }));
    const [major, minor, patch] = manifest.version.split(".").map(Number);
    const [oldMajor, oldMinor, oldPatch] = previous.version.split(".").map(Number);
    if (major !== oldMajor || minor !== oldMinor || patch !== oldPatch + 1) {
      throw new Error(`Expected a patch bump from ${previous.version}; found ${manifest.version}`);
    }
    const date = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date());
    const readme = await readFile("README.md", "utf8");
    const roadmap = await readFile("ROADMAP.md", "utf8");
    const prepared = prepareReleaseDocs({ readme, roadmap, version: manifest.version, date });
    await writeFile("README.md", prepared.readme);
    await writeFile("ROADMAP.md", prepared.roadmap);
    console.log(`Prepared changelog and roadmap for ${manifest.version}.`);
    return;
  }
  if (mode === "published" && /^\d+\.\d+\.\d+$/.test(requestedVersion ?? "")) {
    const roadmap = await readFile("ROADMAP.md", "utf8");
    const updated = markReleasePublished(roadmap, requestedVersion);
    if (updated === roadmap) {
      console.log(`No generated-metadata release-candidate section for ${requestedVersion}; roadmap unchanged.`);
      return;
    }
    await writeFile("ROADMAP.md", updated);
    console.log(`Marked ${requestedVersion} as published in ROADMAP.md.`);
    return;
  }
  throw new Error("Usage: node scripts/release-docs.mjs prepare | published VERSION");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
