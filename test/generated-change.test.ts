import assert from "node:assert/strict";
import test from "node:test";
import { classifyGeneratedChanges, sourceMatchesGeneratedSchema } from "../scripts/generated-change.mjs";

function generatedSource(
  datasets: Record<string, { count: number; fields: Record<string, string[]> }>,
): string {
  const names = Object.keys(datasets).sort().map((name) => `  | ${JSON.stringify(name)}`).join("\n");
  const entries = Object.entries(datasets).sort(([left], [right]) => left.localeCompare(right)).map(([name, dataset]) => {
    const fields = Object.entries(dataset.fields).sort(([left], [right]) => left.localeCompare(right))
      .map(([field, types]) => `    ${JSON.stringify(field)}: ${JSON.stringify(types)}`).join(",\n");
    return `  ${JSON.stringify(name)}: { count: ${dataset.count}, fields: {\n${fields}\n  } }`;
  }).join(",\n");

  return `export type GeneratedDatasetName =\n${names};\n\nexport type GeneratedDatasetInfo = {\n  count: number;\n  fields: Record<string, string[]>;\n};\n\nexport const generatedDatasetInfo: Record<GeneratedDatasetName, GeneratedDatasetInfo> = {\n${entries}\n};\n`;
}

const baseline = {
  tasks: { count: 10, fields: { id: ["string"], objectives: ["string"] } },
  weapons: { count: 4, fields: { id: ["string"], weight: ["string"] } },
};

test("classifies added datasets and fields as compatible", () => {
  const current = {
    ...baseline,
    tasks: { count: 11, fields: { ...baseline.tasks.fields, briefing: ["string"] } },
    bosses: { count: 2, fields: { id: ["string"] } },
  };

  assert.deepEqual(classifyGeneratedChanges(generatedSource(baseline), generatedSource(current)), {
    schemaChanged: true,
    breaking: false,
    countChanged: true,
    addedDatasets: ["bosses"],
    removedDatasets: [],
    addedFields: ["tasks.briefing"],
    removedFields: [],
    addedTypes: [],
    removedTypes: [],
  });
});

test("classifies dataset, field, and type removals as breaking", () => {
  const current = {
    tasks: { count: 9, fields: { id: ["string"] } },
    weapons: { count: 4, fields: { id: ["string"], weight: ["number"] } },
  };

  const change = classifyGeneratedChanges(generatedSource(baseline), generatedSource(current));
  assert.equal(change.schemaChanged, true);
  assert.equal(change.breaking, true);
  assert.deepEqual(change.removedDatasets, []);
  assert.deepEqual(change.removedFields, ["tasks.objectives"]);
  assert.deepEqual(change.removedTypes, ["weapons.weight:string"]);
});

test("treats record-count-only changes as no SDK schema update", () => {
  const current = {
    tasks: { ...baseline.tasks, count: 12 },
    weapons: { ...baseline.weapons, count: 3 },
  };

  const previousSource = generatedSource(baseline);
  const currentSource = generatedSource(current);
  assert.equal(sourceMatchesGeneratedSchema(previousSource, currentSource), true);
  assert.deepEqual(classifyGeneratedChanges(previousSource, currentSource), {
    schemaChanged: false,
    breaking: false,
    countChanged: true,
    addedDatasets: [],
    removedDatasets: [],
    addedFields: [],
    removedFields: [],
    addedTypes: [],
    removedTypes: [],
  });
});

test("accepts datasets with no observed fields", () => {
  const empty = { cleanup: { count: 0, fields: {} } };
  assert.equal(classifyGeneratedChanges(generatedSource(empty), generatedSource(empty)).schemaChanged, false);
});

test("classifies removed dataset names as breaking", () => {
  const current = { tasks: baseline.tasks };
  const change = classifyGeneratedChanges(generatedSource(baseline), generatedSource(current));
  assert.equal(change.schemaChanged, true);
  assert.equal(change.breaking, true);
  assert.deepEqual(change.removedDatasets, ["weapons"]);
});
