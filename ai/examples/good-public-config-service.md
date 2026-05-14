# Good Public Config Service

Source: `apps/api/src/public-sdk/public-sdk.service.ts` (sha256: `b0e6690adfe1e01ef72cd3c71a3185e5254a670d86fe8fe12e03b0a2db6fba96`)

Why this is canonical:

- Authenticates public config access through hashed SDK keys.
- Reads SDK key, state, and flag values in one transactional path.
- Preserves ETag and not-modified semantics for SDK cache behavior.

Canonical public config pattern from `apps/api/src/public-sdk/public-sdk.service.ts`.

```ts
const transactionResult = await this.prisma.$transaction(
  async (tx) => {
    const sdkKey = await tx.sdkKey.findUnique({
      where: { keyHash: hashSdkKey(rawSdkKey) },
      include: {
        project: { select: { id: true, slug: true } },
        config: { select: { id: true, key: true } },
        environment: { select: { id: true, key: true } },
      },
    });

    if (!sdkKey || sdkKey.revokedAt) {
      throw new NotFoundException("SDK key not found");
    }

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
if (this.matchesIfNoneMatch(ifNoneMatch, state.etag)) {
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
