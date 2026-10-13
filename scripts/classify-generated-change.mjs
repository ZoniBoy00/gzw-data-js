import { appendFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { classifyGeneratedChanges } from "./generated-change.mjs";

const target = "src/generated/datasets.ts";
const previous = execFileSync("git", ["show", `HEAD:${target}`], { encoding: "utf8" });
const current = await readFile(target, "utf8");
const result = classifyGeneratedChanges(previous, current);
const summary = [
  ...result.addedDatasets.map((name) => `Added dataset: \`${name}\``),
  ...result.removedDatasets.map((name) => `Removed dataset: \`${name}\``),
  ...result.addedFields.map((name) => `Added field: \`${name}\``),
  ...result.removedFields.map((name) => `Removed field: \`${name}\``),
  ...result.addedTypes.map((name) => `Added field type: \`${name}\``),
  ...result.removedTypes.map((name) => `Removed field type: \`${name}\``),
].join("\n");

console.log(JSON.stringify(result, null, 2));
if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `schema_changed=${result.schemaChanged}\nbreaking=${result.breaking}\ncount_changed=${result.countChanged}\n`);
}
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, [
    "## Generated SDK metadata comparison",
    "",
    `- Schema change: **${result.schemaChanged ? "yes" : "no"}**`,
    `- Potentially breaking removals/type narrowing: **${result.breaking ? "yes" : "no"}**`,
    `- Record-count snapshot changed: **${result.countChanged ? "yes" : "no"}**`,
    "",
    summary || "No dataset or field schema changes found.",
    "",
  ].join("\n"));
}
