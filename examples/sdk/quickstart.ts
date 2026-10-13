import { GzwDataClient } from "../../src/index.js";

/** Runnable shape of the website's SDK quick start; call this from your app. */
export async function loadWeaponsPage() {
  const gzw = new GzwDataClient();
  const response = await gzw.dataset("weapons").list({ page: 1, perPage: 20 });

  return {
    weapons: response.data,
    total: response.total,
  };
}
