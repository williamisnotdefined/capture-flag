# Good Public Config Service

Source: `apps/api/src/public-sdk/public-sdk.service.ts` (sha256: `f3d274c589f65eaab0ec42821d9ed5e780c3d9dd026cf94de90816f898a74ac9`)

Why this is canonical:

- Authenticates public config access through hashed SDK keys.
- Reads SDK key, state, and flag values in one transactional path.
- Preserves ETag and not-modified semantics for SDK cache behavior.
- Uses safe default cache headers for SDK-key URLs while allowing explicit deployment override.
- Records SDK key usage without making telemetry writes break valid config responses.

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

## Cache-Control And Usage Pattern

```ts
private cacheControlHeader() {
  return process.env.PUBLIC_CONFIG_CACHE_CONTROL ?? "private, no-cache";
}

private async recordSdkKeyUse(sdkKeyId: string) {
  try {
    await this.prisma.sdkKey.updateMany({
      where: { id: sdkKeyId, revokedAt: null },
      data: { lastUsedAt: new Date() },
    });
  } catch {
    return;
  }
}
```

The public endpoint defaults away from shared caching because the raw SDK key is in the URL path, and usage telemetry is best-effort after a valid config read.
