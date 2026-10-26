/**
 * TinyFish API client with concurrency limiting, rate limiting,
 * in-memory caching, 429 retry logic, and error sanitization.
 */

export interface TinyFishSearchResult {
  position?: number;
  title: string;
  snippet?: string;
  url: string;
  site_name?: string;
  date?: string;
}

export interface TinyFishSearchResponse {
  query?: string;
  results: TinyFishSearchResult[];
  total_results?: number;
  page?: number;
}

export interface TinyFishFetchItem {
  url: string;
  title?: string;
  text?: string;
}

export interface TinyFishFetchResponse {
  results?: TinyFishFetchItem[];
  errors?: Array<{ url: string; error?: string }>;
}

export interface SourceFetchStatus {
  sourceName: string;
  domain: string;
  url: string;
  status: "ok" | "thin" | "failed" | "not_used";
  charCount: number;
  opportunityCount: number;
}

// In-memory 30-minute page cache: url -> { text, title, timestamp }
interface CacheEntry {
  text: string;
  title: string;
  timestamp: number;
}
const PAGE_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

let firstSearchLogged = false;

// Concurrency limiter: max 4 parallel calls
class ConcurrencyLimiter {
  private activeCount = 0;
  private queue: Array<() => void> = [];
  private readonly maxConcurrent = 4;

  // Rate limiter: 30 requests / minute
  private requestTimestamps: number[] = [];
  private readonly maxPerMinute = 30;

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const tryExecute = async () => {
        // Enforce rate limit (30 req / min)
        const now = Date.now();
        this.requestTimestamps = this.requestTimestamps.filter(
          (t) => now - t < 60000
        );

        if (
          this.activeCount < this.maxConcurrent &&
          this.requestTimestamps.length < this.maxPerMinute
        ) {
          this.activeCount++;
          this.requestTimestamps.push(Date.now());
          resolve();
        } else {
          // Wait and retry
          const waitMs =
            this.requestTimestamps.length >= this.maxPerMinute
              ? Math.max(100, 60000 - (now - this.requestTimestamps[0]) + 50)
              : 100;
          setTimeout(() => {
            if (this.queue.length > 0) {
              const next = this.queue.shift();
              if (next) next();
            }
          }, waitMs);
        }
      };

      this.queue.push(() => {
        tryExecute();
      });

      if (this.activeCount < this.maxConcurrent) {
        const next = this.queue.shift();
        if (next) next();
      }
    });
  }

  release(): void {
    this.activeCount = Math.max(0, this.activeCount - 1);
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

const limiter = new ConcurrencyLimiter();

export class TinyFishError extends Error {
  statusCode?: number;
  friendlyMessage: string;

  constructor(message: string, statusCode?: number, friendlyMessage?: string) {
    super(message);
    this.name = "TinyFishError";
    this.statusCode = statusCode;
    this.friendlyMessage =
      friendlyMessage || TinyFishError.mapStatusCodeToFriendly(statusCode);
  }

  static mapStatusCodeToFriendly(statusCode?: number): string {
    if (statusCode === 401) return "Your TinyFish API key looks wrong";
    if (statusCode === 429) return "Too many requests, wait a minute";
    if (statusCode === 402) return "Daily free limit reached";
    return "Couldn't reach TinyFish";
  }
}

/**
 * Perform an authenticated fetch to TinyFish with concurrency limit,
 * 429 retry once after 3 seconds, and custom timeout.
 */
async function callTinyFishApi(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  isRetry = false
): Promise<Response> {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) {
    throw new TinyFishError(
      "Missing TINYFISH_API_KEY in environment",
      401,
      "TinyFish API key is missing. Please configure it in .env.local"
    );
  }

  await limiter.acquire();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.status === 429 && !isRetry) {
      limiter.release();
      console.warn("[TinyFish] Received 429 (Rate Limit). Retrying after 3 seconds...");
      await new Promise((r) => setTimeout(r, 3000));
      return callTinyFishApi(url, options, timeoutMs, true);
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.error(`[TinyFish] Error ${res.status}: ${errorText}`);
      throw new TinyFishError(
        `TinyFish HTTP ${res.status}: ${errorText}`,
        res.status,
        TinyFishError.mapStatusCodeToFriendly(res.status)
      );
    }

    return res;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof TinyFishError) {
      throw err;
    }
    const isAbort = (err as { name?: string })?.name === "AbortError";
    console.error("[TinyFish] Network or timeout error:", err);
    throw new TinyFishError(
      isAbort ? `TinyFish request timed out after ${timeoutMs}ms` : "Network error reaching TinyFish",
      undefined,
      "Couldn't reach TinyFish"
    );
  } finally {
    limiter.release();
  }
}

/**
 * TinyFish Search API
 * Endpoint: GET https://api.search.tinyfish.ai
 */
export async function searchTinyFish(params: {
  query: string;
  location?: string;
  language?: string;
  after_date?: string;
  include_domains?: string;
  exclude_domains?: string;
}): Promise<TinyFishSearchResult[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("query", params.query);
  searchParams.set("location", params.location || "IN");
  searchParams.set("language", params.language || "en");

  if (params.after_date) searchParams.set("after_date", params.after_date);
  if (params.include_domains) searchParams.set("include_domains", params.include_domains);
  if (params.exclude_domains) searchParams.set("exclude_domains", params.exclude_domains);

  const requestUrl = `https://api.search.tinyfish.ai?${searchParams.toString()}`;
  console.log(`[TinyFish Search] Querying: "${params.query}" (include_domains: ${params.include_domains || "none"})`);

  const response = await callTinyFishApi(
    requestUrl,
    { method: "GET" },
    15000 // 15s timeout
  );

  const data = (await response.json()) as TinyFishSearchResponse;

  if (!firstSearchLogged) {
    firstSearchLogged = true;
    console.log("[TinyFish Search] Raw response of the first call:", JSON.stringify(data, null, 2));
  }

  return data.results || [];
}

/**
 * TinyFish Fetch API
 * Endpoint: POST https://api.fetch.tinyfish.ai
 * Body: { "urls": ["...", "..."] } (max 10 URLs per call)
 * Supports 30-minute in-memory caching.
 */
export async function fetchTinyFishUrls(
  urls: string[],
  onProgress?: (url: string, status: "cached" | "fetching" | "ok" | "thin" | "failed", chars: number) => void
): Promise<Map<string, { text: string; title: string; status: "ok" | "thin" | "failed" }>> {
  const results = new Map<string, { text: string; title: string; status: "ok" | "thin" | "failed" }>();
  const now = Date.now();
  const urlsToFetch: string[] = [];

  // Check in-memory cache first
  for (const url of urls) {
    const cached = PAGE_CACHE.get(url);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      const status: "ok" | "thin" | "failed" = cached.text.length >= 500 ? "ok" : cached.text.length > 0 ? "thin" : "failed";
      results.set(url, {
        text: cached.text,
        title: cached.title,
        status,
      });
      if (onProgress) onProgress(url, "cached", cached.text.length);
    } else {
      urlsToFetch.push(url);
    }
  }

  if (urlsToFetch.length === 0) {
    return results;
  }

  // Split into batches of max 10 URLs
  const batches: string[][] = [];
  for (let i = 0; i < urlsToFetch.length; i += 10) {
    batches.push(urlsToFetch.slice(i, i + 10));
  }

  for (const batch of batches) {
    console.log(`[TinyFish Fetch] Fetching batch of ${batch.length} URLs...`);
    batch.forEach((u) => onProgress?.(u, "fetching", 0));

    try {
      const response = await callTinyFishApi(
        "https://api.fetch.tinyfish.ai",
        {
          method: "POST",
          body: JSON.stringify({ urls: batch }),
        },
        150000 // 150s timeout
      );

      const data = (await response.json()) as TinyFishFetchResponse;

      // Process successful results
      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          const text = item.text || "";
          const title = item.title || "";
          const status: "ok" | "thin" | "failed" = text.length >= 500 ? "ok" : text.length > 0 ? "thin" : "failed";

          PAGE_CACHE.set(item.url, { text, title, timestamp: Date.now() });
          results.set(item.url, { text, title, status });
          onProgress?.(item.url, status, text.length);
          console.log(`[TinyFish Fetch] URL: ${item.url} -> ${status} (${text.length} chars)`);
        }
      }

      // Process reported errors without crashing
      if (data.errors && Array.isArray(data.errors)) {
        for (const err of data.errors) {
          console.warn(`[TinyFish Fetch] Skipped failed URL: ${err.url} (${err.error || "failed"})`);
          results.set(err.url, { text: "", title: "", status: "failed" });
          onProgress?.(err.url, "failed", 0);
        }
      }

      // Check if any URLs in the batch were missing from both results and errors
      for (const u of batch) {
        if (!results.has(u)) {
          results.set(u, { text: "", title: "", status: "failed" });
          onProgress?.(u, "failed", 0);
        }
      }
    } catch (err: unknown) {
      console.error("[TinyFish Fetch] Batch failed:", err);
      // Mark all URLs in this batch as failed so pipeline continues
      for (const u of batch) {
        results.set(u, { text: "", title: "", status: "failed" });
        onProgress?.(u, "failed", 0);
      }
    }
  }

  return results;
}
