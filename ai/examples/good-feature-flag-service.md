# Good Feature Flag Service

Source: `apps/api/src/feature-flags/use-cases/create-feature-flag.service.ts` (sha256: `3efb699038429bd49d0e375ed1480c3d07bf891e4f9038e76ee4697bda3494ff`)
Source: `apps/api/src/feature-flags/use-cases/update-feature-flag-environment-value.service.ts` (sha256: `747fe77dc136e90424ca294d9d2c8c1f2a811f127d4ab10c94a46ae452c09e02`)

Why this is canonical:

- Initializes SDK-visible values for every existing environment.
- Keeps feature flag creation and environment values in one transaction.
- Avoids revision, ETag, and audit churn for no-op public value updates.
- Validates prerequisite flag references before saving SDK-visible rules.

Canonical feature flag service patterns from the feature flag use-case services.

## Creation Pattern

```ts
const defaultValue = normalizeFlagDefaultValue(
  type,
  input.defaultValue === undefined ? defaultValueForFlagType(type) : input.defaultValue,
);

return this.prisma.$transaction(async (tx) => {
  const flag = await tx.featureFlag.create({
    data: {
      projectId: config.projectId,
      configId,
      key,
      name,
      initialDefaultValue: defaultValue as Prisma.InputJsonValue,
      tags,
      ownerUserId,
    },
  });

  const environments = await tx.environment.findMany({
    where: { projectId: config.projectId },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  await tx.featureFlagEnvironmentValue.createMany({
    data: environments.map((environment) => ({
      projectId: config.projectId,
      configId,
      featureFlagId: flag.id,
      environmentId: environment.id,
      defaultValue: defaultValue as Prisma.InputJsonValue,
      rulesJson: [] as Prisma.InputJsonValue,
      percentageAttribute: "identifier",
      percentageOptionsJson: [] as Prisma.InputJsonValue,
      updatedByUserId: userId,
    })),
  });
});
```

Creation initializes every existing environment with SDK-visible values.

## No-Op Value Update Pattern

```ts
if (
  existingValue &&
  !this.featureFlagPublicValue.hasPublicValueChange(existingValue, publicUpdate)
) {
  return existingValue;
}
```

No-op public value updates must not bump revision, ETag, or audit.
