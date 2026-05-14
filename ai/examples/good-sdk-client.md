# Good SDK Client

Source: `packages/sdk-js/src/index.ts` (sha256: `ad199000c6b92630e8bf8c078f1dd6fcc50be7df79e17d62d5119684b7e43379`)

Why this is canonical:

- Keeps config fetching and cache behavior inside the SDK client boundary.
- Uses ETag validators without reprocessing `304 Not Modified` responses.
- Supports lazy loading by default while keeping manual, auto polling, and offline modes explicit.
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

The SDK fetches config with the SDK key, keeps evaluation context local, preserves usable cache on refresh failures, and degrades to fallback when no safe config is available.
