# Good React SDK Hook

Source: `packages/react/src/index.tsx` (sha256: `eea686606b522e0ec086f84819fac65257ff8bc14bd4d55763a43b1545d9b2b7`)
Source: `packages/react/test/index.spec.tsx` (sha256: `ba450dca2313d5547514dc98d9a267d1a6e80cad987c1063c8c79298c023fbc8`)

Why this is canonical:

- Keeps React integration around an injected SDK client.
- Returns fallback on initial render and on SDK failure.
- Lets hook context override provider context without sending context to the API.

## Hook Pattern

```tsx
const [value, setValue] = useState<TValue>(fallbackValue);
const effectiveContext = context === undefined ? captureFlag.context : context;

useEffect(() => {
  let cancelled = false;

  setValue(fallbackValue);
  captureFlag.client.getValue(key, fallbackValue, effectiveContext).then(
    (nextValue) => {
      if (!cancelled) {
        setValue(nextValue);
      }
    },
    () => {
      if (!cancelled) {
        setValue(fallbackValue);
      }
    },
  );

  return () => {
    cancelled = true;
  };
}, [captureFlag.client, effectiveContext, fallbackValue, key]);
```

The cancellation guard prevents stale async updates after dependency changes.
