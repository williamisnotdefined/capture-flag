# Good SDK Client

Source: `packages/sdk-js/src/index.ts` (sha256: `574aa9ad3e1ea99c041db80b43fc5df2b67e564edc3d8b6188ff160496826104`)

Why this is canonical:

- Keeps config fetching inside the SDK client boundary.
- Delegates evaluation to `@capture-flag/evaluator`.
- Returns caller fallback instead of leaking SDK failures.

Canonical SDK client pattern from `packages/sdk-js/src/index.ts`.

```ts
export function createClient(options: CaptureFlagClientOptions): CaptureFlagClient {
  let cachedConfig: CaptureFlagConfig | null = null;

  async function getConfig(): Promise<CaptureFlagConfig | null> {
    if (cachedConfig) {
      return cachedConfig;
    }

    const response = await fetch(configUrl(options.baseUrl, options.sdkKey));
    if (!response.ok) {
      return null;
    }

    const config = await response.json();
    if (!isCaptureFlagConfig(config)) {
      return null;
    }

    cachedConfig = config;
    return cachedConfig;
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
  };
}
```

The SDK fetches config with the SDK key, keeps evaluation context local, and degrades to fallback.
