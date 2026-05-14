# Good SDK Client

Source: `packages/sdk-js/src/index.ts` (sha256: `31124caa54e8b0c20432de9949e552a2c8d8efb32d7d4b1b9d147d6ce29ca91f`)

Why this is canonical:

- Keeps config fetching and cache behavior inside the SDK client boundary.
- Uses ETag validators without reprocessing `304 Not Modified` responses.
- Supports lazy loading by default while keeping manual, auto polling, and offline modes explicit.
- Preserves valid cache when refresh fails or remote config is invalid.
- Keeps localStorage persistent cache opt-in and free of raw SDK keys.
- Delegates local evaluation to `@capture-flag/evaluator`.
- Returns caller fallback instead of leaking SDK failures.

Canonical SDK client pattern from `packages/sdk-js/src/index.ts`.

```ts
export function createClient(options: CaptureFlagClientOptions): CaptureFlagClient {
  const mode = options.mode ?? "lazy";
  let cacheEntry: CacheEntry | null = readStoredCache(storage, options.localStorageKey);

  async function getConfig(): Promise<CaptureFlagConfig | null> {
    if (mode === "offline" || mode === "manual") {
      return cacheEntry?.config ?? null;
    }

    if (cacheEntry && (mode === "auto" || !isCacheExpired(cacheEntry, cacheTtlMs))) {
      return cacheEntry.config;
    }

    await refreshConfig();
    return cacheEntry?.config ?? null;
  }

  return {
    async getValue(key, fallbackValue, context) {
      try {
        return evaluate({
          config: await getConfig(),
          context,
          fallbackValue,
          flagKey: key,
        });
      } catch {
        return fallbackValue;
      }
    },
    async refresh() {
      await refreshConfig();
    },
    close() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    },
  };
}
```

## Refresh And ETag Pattern

```ts
async function fetchAndUpdateCache(): Promise<void> {
  const response = await fetchConfig(options.baseUrl, options.sdkKey, cacheEntry?.etag ?? null);

  if (response.status === 304) {
    if (cacheEntry) {
      writeCache({ ...cacheEntry, cachedAt: Date.now() });
    }
    return;
  }

  if (!response.ok) {
    return;
  }

  const config = await response.json();
  if (!isCaptureFlagConfig(config)) {
    return;
  }

  writeCache({
    cachedAt: Date.now(),
    config,
    etag: response.headers.get("etag"),
  });
}
```

The SDK sends `If-None-Match` only when a cached ETag exists, treats `304` as a freshness update, and validates config before replacing cache.

## Persistent Cache Pattern

```ts
const storedValue: StoredCacheEntry = {
  ...entry,
  schemaVersion: CACHE_SCHEMA_VERSION,
};
storage.setItem(key, JSON.stringify(storedValue));
```

Persistent cache is opt-in through `localStorageKey` and stores cache metadata plus config data, not the raw SDK key.

The SDK fetches config with the SDK key, keeps evaluation context local, preserves usable cache on refresh failures, and degrades to fallback when no safe config is available.
