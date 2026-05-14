# React SDK Provider Architecture

`packages/react` wraps the JavaScript SDK for React applications.

## Provider Boundary

- `CaptureFlagProvider` receives an already-created `CaptureFlagClient`.
- The provider may receive a default evaluation context.
- The package does not create SDK clients, fetch configs directly, or import server-only code.

## Hook Flow

1. `useFeatureFlag` reads the SDK client and provider context from React context.
2. If no provider exists, it throws a clear usage error.
3. The hook returns the fallback value immediately.
4. An effect asks the SDK client for the resolved value.
5. Hook context overrides provider context when provided.
6. Stale async responses are ignored after dependency changes or unmount.

## Testing Boundary

React SDK tests use a fake `CaptureFlagClient` and assert rendered provider/hook behavior.
