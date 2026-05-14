# Config And SDK Terms

Terms shared by API, public config, evaluator, SDK, and client UI.

## Feature Flag

SDK-visible setting controlled by Capture Flag. Supported types are `boolean`, `string`, `integer`, and `double`.

## Default Value

Configured flag value stored in the database and emitted in Config JSON. This is not the same as SDK fallback value.

## Fallback Value

Value supplied by application code when calling `getValue`. The SDK returns fallback when config is unavailable, invalid, missing, or type-mismatched.

## Rules

Ordered targeting rules emitted as `rules` in public Config JSON. The evaluator checks rules before percentage rollout.

## Segment

Reusable group of attribute conditions scoped to one config and emitted as `segments` in public Config JSON.

## Segment Reference

A rule condition shaped as `{ "segment": "segment-key" }`. It is evaluated locally by checking the referenced segment conditions against the Evaluation Context.

## Percentage Rollout

Deterministic distribution of values based on a rollout attribute such as `identifier`.

## Percentage Attribute

Context attribute used for rollout bucketing. Defaults to `identifier`.

## SDK Key

Read-only credential scoped to one config and one environment. Stored as a hash in the API database.

## Raw SDK Key

The full SDK credential shown only immediately after creation. It must never be stored, logged, audited, or re-displayed.

## Key Prefix

Display-safe prefix derived from the raw SDK key and stored for UI identification and audit metadata.

## Config JSON

Versioned public JSON downloaded by SDKs. It contains local-evaluation data, not evaluated flag results.

## React SDK

React provider and hook package that receives a JavaScript SDK client and evaluates flags through that client.

## Config Environment State

Per `config + environment` state that stores revision, ETag, and generated timestamp for public config caching.

## ETag

HTTP cache validator used by SDK clients through `If-None-Match`.

## Lazy Loading

Default SDK mode. The client fetches config only when no cache exists or when the cached entry is older than `cacheTtlMs`.

## Auto Polling

SDK mode where the JavaScript client refreshes config in the background on `pollIntervalMs`.

## Manual Refresh

SDK mode where `getValue` uses the current cache and the application calls `refresh()` to fetch new config.

## Offline Mode

SDK mode where the client uses only existing cache and never performs network requests.

## Memory Cache

Default in-process SDK cache used by every client instance.

## localStorage Cache

Browser persistent cache enabled explicitly through SDK options. It stores config, ETag, timestamp, and cache schema version, never the raw SDK key.

## Cache TTL

Duration used by lazy loading to decide whether a cached config should be refreshed.

## Cached ETag

ETag stored with the cached config and sent on refresh through `If-None-Match`.

## Client Close

`client.close()` stops SDK-owned background polling timers.
