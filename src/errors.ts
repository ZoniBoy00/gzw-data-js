import type { GzwErrorCode } from "./types.js";

export class GzwApiError extends Error {
  readonly status: number;
  readonly code: GzwErrorCode;
  readonly details: unknown;
  readonly retryAfter?: number;
  readonly requestUrl?: string;
  readonly method: string;
  readonly statusText?: string;

  constructor(
    message: string,
    options: {
      status: number;
      code?: GzwErrorCode;
      details?: unknown;
      retryAfter?: number;
      requestUrl?: string;
      method?: string;
      statusText?: string;
      cause?: unknown;
    },
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "GzwApiError";
    this.status = options.status;
    this.code = options.code ?? "HTTP_ERROR";
    this.details = options.details;
    this.retryAfter = options.retryAfter;
    this.requestUrl = options.requestUrl;
    this.method = options.method ?? "GET";
    this.statusText = options.statusText;
  }

  get isRateLimited(): boolean {
    return this.code === "RATE_LIMITED" || this.status === 429;
  }

  get isServerError(): boolean {
    return this.code === "SERVER_ERROR" || this.status >= 500;
  }
}

export function abortError(signal: AbortSignal): GzwApiError {
  return new GzwApiError("GZW Data API request was aborted", {
    status: 0,
    code: "ABORTED",
    cause: signal.reason,
  });
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError(signal);
}
