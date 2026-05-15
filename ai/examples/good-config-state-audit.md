# Good Config State And Audit

Source: `apps/api/src/common/config-state.ts` (sha256: `0f307de98712c0bd2e2a790b888d6f710bb9689666da1a257b7a999a788a30f2`)
Source: `apps/api/src/common/audit-log.ts` (sha256: `6ec7b0b9b5fd8eb4073d46719dc01bf60c39be927b6cd3cc693ec20d409d93eb`)
Source: `apps/api/src/environments/environments.service.ts` (sha256: `4c9c1d7554aa39dd66f1716516eecffbe1f2799e95e13f805900b945b7169a75`)

Why this is canonical:

- Keeps revision and ETag changes behind a shared helper.
- Creates config environment state when new environments are created.
- Writes audit logs through sanitized JSON payloads, including config publication entries.

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

Audit entries stay tenant-scoped, append-only, and avoid raw credentials.
