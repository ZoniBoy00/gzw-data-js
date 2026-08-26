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

  it("uses the single-record route and supports all modes", async () => {
    const urls: string[] = [];
    globalThis.fetch = async (input) => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith("/items/alpha")) return response({ data: { id: "alpha", name: "Alpha" } });
      return response({ data: [{ id: "beta" }], count: 1 });
    };
    const client = new GzwDataClient({ baseUrl: "https://example.test/api" });

    assert.deepEqual(await client.dataset("items").get("alpha"), { id: "alpha", name: "Alpha" });
    await client.dataset("items").filter({ type: "Keycard" }, { all: true });

    assert.equal(urls[0], "https://example.test/api/items/alpha");
    assert.equal(urls[1], "https://example.test/api/items?all=true&type=Keycard");
  });

  it("returns undefined for a missing record", async () => {
    globalThis.fetch = async () => response({ error: "Record not found" }, 404);
    const client = new GzwDataClient({ retries: 0 });

    assert.equal(await client.dataset("items").get("missing"), undefined);
  });

  it("rejects empty dataset and record search values", async () => {
    const client = new GzwDataClient({ fetch: async () => response({ data: [] }) });
    assert.throws(() => client.dataset("   "), /Dataset name cannot be empty/);
    await assert.rejects(() => client.dataset("items").get("   "), /Record id cannot be empty/);
    assert.throws(() => client.dataset("items").search("   "), /Dataset search query cannot be empty/);
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

  it("supports search, images, and raw OpenAPI spec", async () => {
    globalThis.fetch = async (input) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/search")) return response({ data: { query: "Mosin", results: { weapons: [{ id: "mosin" }] } } });
      if (path.endsWith("/images")) return response({ data: { mosin: "https://example.test/mosin.jpg" } });
      return response({ openapi: "3.1.0", paths: {} });
    };
    const client = new GzwDataClient({ baseUrl: "https://example.test/api" });

    assert.deepEqual(await client.search("Mosin"), { query: "Mosin", results: { weapons: [{ id: "mosin" }] } });
    assert.deepEqual(await client.images(), { mosin: "https://example.test/mosin.jpg" });
    assert.deepEqual(await client.spec(), { openapi: "3.1.0", paths: {} });
  });

  it("accepts the production direct-array dataset response", async () => {
    globalThis.fetch = async () => response([{ id: "direct" }]);
    const client = new GzwDataClient({ retries: 0 });

    assert.deepEqual(await client.dataset("items").list(), { data: [{ id: "direct" }], count: 1 });
  });

  it("rejects malformed API envelopes", async () => {
    globalThis.fetch = async () => response({ unexpected: true });
    const client = new GzwDataClient({ retries: 0 });

    await assert.rejects(() => client.health(), (error: unknown) => error instanceof GzwApiError && error.code === "INVALID_RESPONSE");
  });

  it("rejects malformed dataset data", async () => {
    globalThis.fetch = async () => response({ data: { not: "an array" } });
    const client = new GzwDataClient({ retries: 0 });

    await assert.rejects(() => client.dataset("items").list(), (error: unknown) => error instanceof GzwApiError && error.code === "INVALID_RESPONSE");
  });

  it("retries network failures and reports retry metadata", async () => {
    let attempts = 0;
    const retryStatuses: Array<number | undefined> = [];
    globalThis.fetch = async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("offline");
      return response({ data: { ok: true, version: "4.0.0" } });
    };
    const client = new GzwDataClient({ retries: 1, retryDelayMs: 0, onRetry: (info) => retryStatuses.push(info.status) });

    assert.deepEqual(await client.health(), { ok: true, version: "4.0.0" });
    assert.equal(attempts, 2);
    assert.deepEqual(retryStatuses, [undefined]);
  });

  it("emits request and response debug metadata without response bodies", async () => {
    const requests: number[] = [];
    const responses: Array<{ status: number; ok: boolean }> = [];
    globalThis.fetch = async () => response({ data: { ok: true, version: "4.0.0" } });
    const client = new GzwDataClient({
      onRequest: (info) => requests.push(info.attempt),
      onResponse: (info) => responses.push({ status: info.status, ok: info.ok }),
    });

    await client.health();
    assert.deepEqual(requests, [1]);
    assert.deepEqual(responses, [{ status: 200, ok: true }]);
  });

  it("iterates all pages using totalPages", async () => {
    const urls: string[] = [];
    globalThis.fetch = async (input) => {
      const url = String(input);
      urls.push(url);
      const page = Number(new URL(url).searchParams.get("page"));
      return page === 1
        ? response({ data: [{ id: "a" }, { id: "b" }], page: 1, perPage: 2, total: 3, totalPages: 2 })
        : response({ data: [{ id: "c" }], page: 2, perPage: 2, total: 3, totalPages: 2 });
    };

    const client = new GzwDataClient({ baseUrl: "https://example.test/api" });
    const records: string[] = [];
    for await (const record of client.dataset("items").iterate({ perPage: 2 })) records.push(record.id!);

    assert.deepEqual(records, ["a", "b", "c"]);
    assert.equal(urls.length, 2);
    assert.equal(new URL(urls[0]).searchParams.get("per_page"), "2");
  });

  it("stops iteration on an incomplete page without totalPages", async () => {
    let requests = 0;
    globalThis.fetch = async () => {
      requests += 1;
      return response({ data: [{ id: "only" }], count: 1, perPage: 2 });
    };
    const client = new GzwDataClient({ retries: 0 });
    const records = [];
    for await (const record of client.dataset("items").iterate({ perPage: 2 })) records.push(record.id);

    assert.deepEqual(records, ["only"]);
    assert.equal(requests, 1);
  });

  it("supports iterator cancellation", async () => {
    const controller = new AbortController();
    globalThis.fetch = async () => response({ data: [{ id: "a" }], perPage: 1, totalPages: 2 });
    const client = new GzwDataClient({ retries: 0 });
    const iterator = client.dataset("items").iterate({ perPage: 1 }, controller.signal);
    assert.deepEqual((await iterator.next()).value, { id: "a" });
    controller.abort();
    await assert.rejects(() => iterator.next(), (error: unknown) => error instanceof GzwApiError && error.code === "ABORTED");
  });

  it("rejects an iterator that exceeds maxPages", async () => {
    globalThis.fetch = async () => response({ data: [{ id: "loop" }], perPage: 1 });
    const client = new GzwDataClient({ retries: 0 });
    const iterator = client.dataset("items").iterate({ perPage: 1, maxPages: 2 });
    await iterator.next();
    await iterator.next();
    await assert.rejects(() => iterator.next(), /exceeded maxPages/);
  });

  it("retries a rate-limited request using a capped Retry-After delay", async () => {
    let attempts = 0;
    const retries: number[] = [];
    globalThis.fetch = async () => {
      attempts += 1;
      return attempts === 1 ? response({ error: { code: "RATE_LIMITED", message: "slow down" } }, 429, { "retry-after": "60" }) : response({ data: [] });
    };
    const client = new GzwDataClient({ retries: 1, retryDelayMs: 0, maxRetryDelayMs: 5, onRetry: (info) => retries.push(info.delayMs) });

    const result = await client.dataset("weapons").list();
    assert.deepEqual(result.data, []);
    assert.equal(attempts, 2);
    assert.deepEqual(retries, [5]);
  });

  it("throws a typed error after retries are exhausted", async () => {
    globalThis.fetch = async () => response({ error: { code: "RECORD_NOT_FOUND", message: "Record not found", dataset: "weapons", id: "missing" } }, 404);
    const client = new GzwDataClient({ retries: 0 });

    await assert.rejects(
      () => client.dataset("weapons").list(),
      (error: unknown) => error instanceof GzwApiError && error.status === 404 && error.code === "RECORD_NOT_FOUND" && error.message === "Record not found" && error.details !== undefined,
    );
  });

  it("reports malformed JSON as an invalid response", async () => {
    globalThis.fetch = async () => new Response("not-json", { status: 200 });
    const client = new GzwDataClient({ retries: 0 });

    await assert.rejects(
      () => client.dataset("weapons").list(),
      (error: unknown) => error instanceof GzwApiError && error.code === "INVALID_RESPONSE" && error.requestUrl?.endsWith("/weapons"),
    );
  });

  it("does not retry an aborted request", async () => {
    const controller = new AbortController();
    controller.abort();
    let attempts = 0;
    globalThis.fetch = async () => {
      attempts += 1;
      return response({ data: [] });
    };
    const client = new GzwDataClient({ retries: 3 });

    await assert.rejects(() => client.dataset("items").list({}, controller.signal), (error: unknown) => error instanceof GzwApiError && error.code === "ABORTED");
    assert.equal(attempts, 0);
  });
});
