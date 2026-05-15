# Good SDK Client

Source: `packages/sdk-js/src/index.ts` (sha256: `ff6f6127445499f2b3a80de444d29859d0a40db40cdc554c92920318cad83bb4`)

Why this is canonical:

- Keeps config fetching and cache behavior inside the SDK client boundary.
- Uses ETag validators without reprocessing `304 Not Modified` responses.
- Supports lazy loading by default while keeping manual, auto polling, and offline modes explicit.
- Preserves valid cache when refresh fails or remote config is invalid.
- Keeps localStorage persistent cache opt-in, scope-fingerprinted, and free of raw SDK keys or raw base URLs.
- Notifies subscribers only when a valid changed config replaces cache.
- Clears subscriptions when the client is closed.
- Delegates local evaluation to `@capture-flag/evaluator`.
- Validates public config shape, including JSON object/array roots, while leaving fallback-safe targeting edge cases to the evaluator.
- Returns caller fallback instead of leaking SDK failures.

Canonical SDK client pattern from `packages/sdk-js/src/index.ts`.

```ts
export function createClient(options: CaptureFlagClientOptions): CaptureFlagClient {
  const mode = options.mode ?? "lazy";
  const storage = getStorage(options);
  const cacheScope = createCacheScope(options.baseUrl, options.sdkKey);
  let cacheEntry: CacheEntry | null = readStoredCache(
    storage,
    options.localStorageKey,
    cacheScope,
  );
  const listeners = new Set<CaptureFlagConfigChangeListener>();

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
      listeners.clear();
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
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

  replaceCache({
    cachedAt: Date.now(),
    config,
    etag: response.headers.get("etag"),
  });
}
```

The SDK sends `If-None-Match` only when a cached ETag exists, treats `304` as a freshness update, and validates config before replacing cache.

## Subscription Pattern

```ts
function replaceCache(nextEntry: CacheEntry): void {
  const previousEntry = cacheEntry;
  writeCache(nextEntry);

  if (!previousEntry || !cacheEntriesRepresentSameConfig(previousEntry, nextEntry)) {
    notifyConfigChanged();
  }
}

function notifyConfigChanged(): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
      // Listener failures must not break SDK polling or cache updates.
    }
  }
}
```

Subscriptions are cache-change notifications only. They do not expose config internals, send evaluation context to the API, or notify for `304`, failed refreshes, invalid configs, or equivalent config responses.

## Persistent Cache Pattern

```ts
const storedValue: StoredCache = isStoredCache(parsedValue)
  ? parsedValue
  : { entries: {}, schemaVersion: CACHE_SCHEMA_VERSION };
storedValue.entries[cacheScope] = entry;
storage.setItem(key, JSON.stringify(storedValue));
```

Persistent cache is opt-in through `localStorageKey` and stores a map of cache metadata plus config data keyed by scope fingerprint, not raw SDK keys or raw base URLs.

The SDK fetches config with the SDK key, keeps evaluation context local, preserves usable cache on refresh failures, and degrades to fallback when no safe config is available.
