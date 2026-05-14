# Good Config State And Audit

Source: `apps/api/src/common/config-state.ts` (sha256: `d9c7dc732d0680f4bd3340cb5ebcfd0cb5249ff471e00153db1800d4a1c96927`)
Source: `apps/api/src/common/audit-log.ts` (sha256: `6ec7b0b9b5fd8eb4073d46719dc01bf60c39be927b6cd3cc693ec20d409d93eb`)
Source: `apps/api/src/environments/environments.service.ts` (sha256: `de5324639c1a62766f927696f558660d410628451d1995d7029e28abc78a2e93`)

Why this is canonical:

- Keeps revision and ETag changes behind a shared helper.
- Creates config environment state when new environments are created.
- Writes audit logs through sanitized JSON payloads.

## Bump Helper

```ts
await tx.configEnvironmentState.updateMany({
  where: { configId, environmentId },
  data: {
    revision: { increment: 1 },
    generatedAt: new Date(),
  },
});
```

The helper then reads the new revision and updates the ETag in the same transaction.

## Audit Helper

```ts
await tx.auditLog.create({
  data: {
    action: input.action,
    actorUserId: input.actorUserId ?? null,
    metadata: input.metadata ?? {},
    organizationId: input.organizationId,
  },
});
```

Audit entries stay tenant-scoped and avoid raw credentials.
