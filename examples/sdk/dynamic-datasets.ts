import { GzwDataClient } from "../../src/index.js";

/** Read the live dataset registry and return names suitable for an app picker. */
export async function listCurrentDatasetNames(client = new GzwDataClient()) {
  const metadata = await client.metadata();
  return metadata.datasets.map((dataset) => dataset.name);
}

/** Fetch metadata and a page from a name discovered at runtime. */
export async function loadDiscoveredDataset(name: string, client = new GzwDataClient()) {
  const dataset = client.dataset(name);
  const [info, page] = await Promise.all([
    dataset.info(),
    dataset.list({ page: 1, perPage: 20 }),
  ]);

  return { info, records: page.data, total: page.total };
}
