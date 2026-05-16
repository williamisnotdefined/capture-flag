# Good SDK Key Service

Source: `apps/api/src/sdk-keys/use-cases/create-sdk-key.service.ts` (sha256: `e2c83a6bdf1653fc73daa5a2e07e2ddb2efcd2bd01b8f4e8e2249eb222bcdc51`)
Source: `apps/api/src/sdk-keys/use-cases/revoke-sdk-key.service.ts` (sha256: `b1e6316e25347dfbd6fd6c7a3b4431361ca11c2eb206e3c18d1cbadd422576f8`)
Source: `apps/api/src/sdk-keys/use-cases/rotate-sdk-key.service.ts` (sha256: `b88c81c89b3ef70f5cb8ab730ae23982dfd5520f24c7c91cd9c07d988fa1625a`)
Source: `apps/api/src/common/sdk-key-crypto.ts` (sha256: `9e1b5884fe94d12dd4004e39e0aa9a90328e1351a79215c1b8c53b81293c5a04`)

Why this is canonical:

- Separates raw SDK key display from hashed persistence.
- Requires project admin access before key creation/revocation.
- Audits SDK key lifecycle without storing the raw credential.
- Rejects duplicate revocation attempts to avoid audit churn.

## Raw Key And Hash

```ts
const credential = this.sdkKeyCredential.createCredential();

const sdkKey = await tx.sdkKey.create({
  data: {
    projectId,
    configId: config.id,
    environmentId: environment.id,
    name: input.name?.trim() || `${config.name} ${environment.name} SDK Key`,
    keyPrefix: credential.keyPrefix,
    keyHash: credential.keyHash,
  },
});
```

Only `keyHash` and `keyPrefix` are persisted.

## Creation Return Shape

```ts
return {
  ...sdkKey,
  key: credential.rawKey,
};
```

The raw key is returned only immediately after creation.
