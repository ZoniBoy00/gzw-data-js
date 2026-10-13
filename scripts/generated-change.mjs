function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function parseGeneratedSource(source) {
  const namesMatch = source.match(/export type GeneratedDatasetName =\n([\s\S]*?);/);
  if (!namesMatch) throw new Error("Could not parse GeneratedDatasetName from generated source");

  const names = [...namesMatch[1].matchAll(/\|\s+"([^"]+)"/g)].map((match) => match[1]);
  const datasets = new Map();
  const entryPattern = /^  "([a-z0-9_]+)": \{ count: (\d+), fields: \{\n([\s\S]*?)\n  \} \},?$/gm;

  for (const match of source.matchAll(entryPattern)) {
    const [, name, countText, body] = match;
    const fields = new Map();
    for (const line of body.split("\n")) {
      if (!line.trim()) continue;
      const fieldMatch = line.match(/^    "([^"]+)": (\[[^\n]*\]),?$/);
      if (!fieldMatch) throw new Error(`Could not parse generated field in ${name}: ${line}`);
      const types = JSON.parse(fieldMatch[2]);
      if (!Array.isArray(types) || types.some((type) => typeof type !== "string")) {
        throw new Error(`Invalid generated field types for ${name}.${fieldMatch[1]}`);
      }
      fields.set(fieldMatch[1], new Set(types));
    }
    datasets.set(name, { count: Number(countText), fields });
  }

  if (names.length !== datasets.size || names.some((name) => !datasets.has(name))) {
    throw new Error("Generated dataset-name union and metadata entries do not match");
  }
  return datasets;
}

export function classifyGeneratedChanges(previousSource, currentSource) {
  const previous = parseGeneratedSource(previousSource);
  const current = parseGeneratedSource(currentSource);
  const previousNames = new Set(previous.keys());
  const currentNames = new Set(current.keys());
  const addedDatasets = sorted([...currentNames].filter((name) => !previousNames.has(name)));
  const removedDatasets = sorted([...previousNames].filter((name) => !currentNames.has(name)));
  const addedFields = [];
  const removedFields = [];
  const addedTypes = [];
  const removedTypes = [];
  let countChanged = false;

  for (const name of previousNames) {
    const before = previous.get(name);
    const after = current.get(name);
    if (!after) continue;
    if (before.count !== after.count) countChanged = true;

    const beforeFields = new Set(before.fields.keys());
    const afterFields = new Set(after.fields.keys());
    for (const field of beforeFields) {
      if (!afterFields.has(field)) {
        removedFields.push(`${name}.${field}`);
        continue;
      }
      const beforeTypes = before.fields.get(field);
      const afterTypes = after.fields.get(field);
      for (const type of beforeTypes) {
        if (!afterTypes.has(type)) removedTypes.push(`${name}.${field}:${type}`);
      }
      for (const type of afterTypes) {
        if (!beforeTypes.has(type)) addedTypes.push(`${name}.${field}:${type}`);
      }
    }
    for (const field of afterFields) {
      if (!beforeFields.has(field)) addedFields.push(`${name}.${field}`);
    }
  }

  if (addedDatasets.some((name) => current.get(name).count !== 0)) countChanged = true;

  return {
    schemaChanged: Boolean(addedDatasets.length || removedDatasets.length || addedFields.length || removedFields.length || addedTypes.length || removedTypes.length),
    breaking: Boolean(removedDatasets.length || removedFields.length || removedTypes.length),
    countChanged,
    addedDatasets,
    removedDatasets,
    addedFields: sorted(addedFields),
    removedFields: sorted(removedFields),
    addedTypes: sorted(addedTypes),
    removedTypes: sorted(removedTypes),
  };
}

export function sourceMatchesGeneratedSchema(previousSource, currentSource) {
  return !classifyGeneratedChanges(previousSource, currentSource).schemaChanged;
}
