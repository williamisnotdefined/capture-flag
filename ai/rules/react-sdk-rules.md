# React SDK Rules

Rules for `packages/react`, the Capture Flag provider, and `useFeatureFlag`.

## Always

- Keep `CaptureFlagProvider` as the owner of the SDK client and optional default evaluation context.
- Keep `useFeatureFlag(key, fallbackValue, context?)` as the public hook shape unless intentionally changing the React SDK contract.
- Return the fallback value on initial render before async SDK resolution completes.
- Let hook-level context override provider context.
- Cancel stale async updates in effects when dependencies change or components unmount.
- Keep React SDK as a thin layer over an injected JavaScript SDK client.
- Treat polling and cache as SDK JS responsibilities; React does not own timers or persistent cache.
- Until Phase 5.1, SDK polling updates the SDK cache but does not automatically re-render `useFeatureFlag` consumers.
- Test behavior through provider/hook usage, not by reaching into internal context.

## Never

- Do not send evaluation context to the API from the React package.
- Do not make `useFeatureFlag` usable outside `CaptureFlagProvider` silently.
- Do not throw async SDK failures into React consumers when fallback behavior is possible.
- Do not add React-owned polling, suspense, persistent cache, or event subscriptions before product requirements call for them.
- Do not import API/server-only packages into `packages/react`.
