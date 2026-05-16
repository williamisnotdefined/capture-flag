# Good Public Config Service

Source: `apps/api/src/public-sdk/public-sdk.service.ts` (sha256: `85e49bab9d48419a9c4333b902d45cd724ae62a4b946eea88831bc3a4d42007c`)

Why this is canonical:

- Authenticates public config access through hashed SDK keys.
- Reads SDK key, state, and flag values in one transactional path.
- Emits config-scoped segments for local SDK evaluation.
- Preserves ETag and not-modified semantics for SDK cache behavior.
- Uses safe default cache headers for SDK-key URLs while allowing explicit deployment override.
- Records SDK key usage without making telemetry writes break valid config responses.

Canonical public config pattern from `apps/api/src/public-sdk/public-sdk.service.ts`.

```ts
const transactionResult = await this.prisma.$transaction(
  async (tx) => {
    const sdkKey = await this.sdkKeyAuth.findActiveSdkKey(tx, rawSdkKey);
    const state = await tx.configEnvironmentState.findUnique({
      where: {
        configId_environmentId: {
          configId: sdkKey.configId,
          environmentId: sdkKey.environmentId,
        },
      },
    });
  },
  { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
);
```

The public endpoint authenticates by hashed SDK key and reads config state in the same transaction as flag values.

## ETag Pattern

```ts
if (this.cache.matchesIfNoneMatch(ifNoneMatch, state.etag)) {
  return {
    result: {
      etag: state.etag,
      cacheControl,
      notModified: true,
    },
    sdkKeyId: sdkKey.id,
  };
}
```

Not-modified responses still count as valid SDK config access for `lastUsedAt`.

## Cache-Control And Usage Pattern

```ts
const cacheControl = this.cache.cacheControlHeader();

await this.sdkKeyUsage.recordUse(transactionResult.sdkKeyId);
```

The public endpoint defaults away from shared caching because the raw SDK key is in the URL path, and usage telemetry is best-effort after a valid config read.
