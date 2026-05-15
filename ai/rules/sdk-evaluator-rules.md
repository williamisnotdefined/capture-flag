# SDK Evaluator Rules

Rules for `packages/sdk-js`, `packages/evaluator`, and `packages/react`.

## Always

- Preserve the SDK shape unless the task explicitly changes it: `createClient(options)` returns `getValue<TValue>(key, fallbackValue, context?)`, `refresh()`, `close()`, and `subscribe(listener)`.
- Keep `fallbackValue` distinct from stored config `defaultValue`.
- Fetch public config with the SDK key, then evaluate locally.
- Keep the evaluator pure and deterministic: no network, database, clock, or random dependencies.
- Evaluate segment reference conditions locally from public config `segments` and the Evaluation Context.
- Treat missing, invalid, empty, or nested segment references as non-matches.
- Evaluate prerequisite flag conditions locally from the same public Config JSON and the same Evaluation Context.
- Treat missing prerequisite flags, invalid prerequisite values, unsupported prerequisite operators, and prerequisite cycles as non-matches.
- Keep prerequisite flag operators limited to `equals` and `notEquals` unless the public contract is explicitly expanded.
- Support advanced attribute operators including `arrayContains`, `dateBefore`, `dateAfter`, `semverEquals`, `semverGreaterThan`, `semverGreaterThanOrEquals`, `semverLessThan`, and `semverLessThanOrEquals`.
- Accept date comparison values only as numeric timestamps or ISO `YYYY-MM-DD`/date-time strings with timezone.
- Compare strict SemVer 2.0.0 strings with `MAJOR.MINOR.PATCH`, prerelease precedence, and ignored build metadata.
- Use deterministic percentage rollout with FNV-1a 32-bit over `${flagKey}:${attributeValue}`, UTF-16/JavaScript code units, modulo `10000`, and percentage basis points with at most two decimal places.
- Return the caller fallback for missing flags, invalid config, unsupported schema versions, type mismatches, and request failures.
- Keep lazy loading as the default SDK mode.
- Keep SDK modes explicit: `lazy`, `auto`, `manual`, and `offline`.
- In lazy mode, respect `cacheTtlMs` before refreshing.
- In auto mode, poll in the SDK client and stop background polling through `client.close()`.
- In manual mode, use the current cache from `getValue` and fetch only through `refresh()`.
- In offline mode, never perform network requests.
- Send `If-None-Match` when a cached ETag exists and treat `304 Not Modified` as a freshness update without reprocessing JSON.
- Preserve an existing valid cache when refresh fails or returns invalid config.
- Notify SDK subscribers only when a valid config with a changed identity replaces the cache.
- Do not notify SDK subscribers for `304 Not Modified`, request failures, non-OK responses, invalid config, or equivalent config responses.
- Keep localStorage cache opt-in, scoped by base URL and SDK key fingerprint, and never persist raw SDK keys or raw base URLs.
- Keep options minimal and explicit.

## Never

- Do not send evaluation context to the API.
- Do not allow segment evaluation to perform network calls or API lookups.
- Do not allow prerequisite evaluation to perform network calls or API lookups.
- Do not import server-only packages into SDK, evaluator, or React SDK packages.
- Do not throw SDK evaluation failures into application code when fallback behavior is possible.
- Do not add retries or custom cache adapters before product requirements call for them.
- Do not add compatibility layers for unshipped config schema versions.

## Evaluation Order

1. Evaluate rules in order, resolving segment and prerequisite flag conditions.
2. Evaluate percentage rollout.
3. Return config `defaultValue`.
4. Return SDK call `fallbackValue` when config is unavailable, invalid, missing, or mismatched.
