# Good SDK Key Service

Source: `apps/api/src/sdk-keys/use-cases/create-sdk-key.service.ts` (sha256: `5b9084b7c56d18abde3ba36737cca2588b9930a075774d99905934e3c52f045b`)
Source: `apps/api/src/sdk-keys/use-cases/revoke-sdk-key.service.ts` (sha256: `d466801bd66692acd228089c3368812c02217d32f52810e505e702506337f709`)
Source: `apps/api/src/sdk-keys/use-cases/rotate-sdk-key.service.ts` (sha256: `f9bb5ff063da95b1310cf0b1b2be47f9a475a52919ab7a08c94aad45e5f2d0e1`)
Source: `apps/api/src/common/sdk-key-crypto.ts` (sha256: `9e1b5884fe94d12dd4004e39e0aa9a90328e1351a79215c1b8c53b81293c5a04`)

Why this is canonical:

- Separates raw SDK key display from hashed persistence.
- Requires project admin access before key creation/revocation.
- Audits SDK key lifecycle without storing the raw credential.
- Rejects duplicate revocation attempts to avoid audit churn.

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
