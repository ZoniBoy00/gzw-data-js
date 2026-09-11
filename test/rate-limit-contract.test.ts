import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GzwApiError, GzwDataClient } from "../src/index.js";

type MockResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

function response(body: unknown, status = 200, headers: Record<string, string> = {}): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 429 ? "Too Many Requests" : "OK",
    headers: new Headers(headers),
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe("HTTP 429 contract", () => {
  it("exposes a typed rate-limit error and retry metadata", async () => {
    const previousFetch = globalThis.fetch;
    const retryEvents: Array<{ attempt: number; status?: number }> = [];
    try {
      let attempts = 0;
      globalThis.fetch = async () => {
        attempts += 1;
        return response({ error: { code: "RATE_LIMITED", message: "Slow down" } }, 429, { "Retry-After": "0" }) as unknown as Response;
      };
      const client = new GzwDataClient({ retries: 0, onRetry: (event) => retryEvents.push(event) });
      await assert.rejects(() => client.health(), (error: unknown) => {
        assert.ok(error instanceof GzwApiError);
        assert.equal(error.status, 429);
        assert.equal(error.code, "RATE_LIMITED");
        assert.equal(error.retryAfter, 0);
        assert.equal(error.isRateLimited, true);
        return true;
      });
      assert.equal(attempts, 1);
      assert.deepEqual(retryEvents, []);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });

  it("retries a 429 response only when retries are enabled", async () => {
    const previousFetch = globalThis.fetch;
    try {
      let attempts = 0;
      globalThis.fetch = async () => {
        attempts += 1;
        return attempts === 1
          ? response({ error: { code: "RATE_LIMITED" } }, 429, { "Retry-After": "0" }) as unknown as Response
          : response({ data: { ok: true, ready: true } }) as unknown as Response;
      };
      const client = new GzwDataClient({ retries: 1, retryDelayMs: 0 });
      assert.deepEqual(await client.health(), { ok: true, ready: true });
      assert.equal(attempts, 2);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});
