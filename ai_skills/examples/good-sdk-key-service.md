# Good SDK Key Service

Source: `apps/api/src/sdk-keys/sdk-keys.service.ts` (sha256: `e023efd81ba6e63df2642ba441a46ecf98091f0c1b92bafb1a8aa4e45cfe2b21`)
Source: `apps/api/src/common/sdk-key-crypto.ts` (sha256: `9e1b5884fe94d12dd4004e39e0aa9a90328e1351a79215c1b8c53b81293c5a04`)

Why this is canonical:

- Separates raw SDK key display from hashed persistence.
- Requires project admin access before key creation/revocation.
- Audits SDK key lifecycle without storing the raw credential.

## Raw Key And Hash

```ts
const rawKey = createRawSdkKey();
const keyPrefix = rawKey.slice(0, 18);
const keyHash = hashSdkKey(rawKey);
```

Only `keyHash` and `keyPrefix` are persisted.

## Creation Return Shape

```ts
return {
  ...sdkKey,
  key: rawKey,
};
```

The raw key is returned only immediately after creation.
