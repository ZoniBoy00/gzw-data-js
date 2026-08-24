import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { GzwApiError, GzwDataClient } from "../src/index.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function response(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("GzwDataClient", () => {
  it("lists a dataset with pagination and query parameters", async () => {
    let requestedUrl = "";
    globalThis.fetch = async (input) => {
      requestedUrl = String(input);
      return response({ data: [{ id: "ak-74", name: "AK-74" }], count: 1, page: 2, perPage: 10, total: 11, totalPages: 2 });
    };

    const client = new GzwDataClient({ baseUrl: "https://example.test/api" });
    const result = await client.dataset("weapons").list({ page: 2, perPage: 10, search: "AK" });

    assert.deepEqual(result.data[0], { id: "ak-74", name: "AK-74" });
    assert.equal(result.totalPages, 2);
    assert.equal(requestedUrl, "https://example.test/api/weapons?page=2&per_page=10&search=AK");
  });

  it("supports get, filter, and all modes", async () => {
    const urls: string[] = [];
    globalThis.fetch = async (input) => {
      urls.push(String(input));
      return response({ data: [{ id: "alpha" }], count: 1 });
    };
    const client = new GzwDataClient({ baseUrl: "https://example.test/api" });

    await client.dataset("items").get("alpha");
    await client.dataset("items").filter({ type: "Keycard" }, { all: true });

    assert.equal(urls[0], "https://example.test/api/items?id=alpha&limit=1");
    assert.equal(urls[1], "https://example.test/api/items?all=true&type=Keycard");
  });

  it("unwraps stats, health, and API root data", async () => {
    globalThis.fetch = async (input) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/stats")) return response({ data: { weapons: { total: 44 } } });
      if (path.endsWith("/health")) return response({ data: { ok: true, version: "4.0.0" } });
      return response({ data: { name: "GZW Data API", endpoints: ["weapons"] } });
    };
    const client = new GzwDataClient({ baseUrl: "https://example.test/api" });

    assert.deepEqual(await client.stats(), { weapons: { total: 44 } });
    assert.deepEqual(await client.health(), { ok: true, version: "4.0.0" });
    assert.deepEqual(await client.endpoints(), { name: "GZW Data API", endpoints: ["weapons"] });
  });

  it("retries a rate-limited request using Retry-After", async () => {
    let attempts = 0;
    globalThis.fetch = async () => {
      attempts += 1;
      return attempts === 1 ? response({ error: "slow down" }, 429, { "retry-after": "0" }) : response({ data: [] });
    };
    const client = new GzwDataClient({ retries: 1, retryDelayMs: 0 });

    const result = await client.dataset("weapons").list();
    assert.deepEqual(result.data, []);
    assert.equal(attempts, 2);
  });

  it("throws a typed error after retries are exhausted", async () => {
    globalThis.fetch = async () => response({ error: "broken" }, 500);
    const client = new GzwDataClient({ retries: 0 });

    await assert.rejects(
      () => client.dataset("weapons").list(),
      (error: unknown) => error instanceof GzwApiError && error.status === 500 && error.code === "HTTP_ERROR",
    );
  });
});
