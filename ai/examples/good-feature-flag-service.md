# Good Feature Flag Service

Source: `apps/api/src/feature-flags/feature-flags.service.ts` (sha256: `10e5d44e0212604d885fa44e204eb56d193e35630a56c8863d690eeaafb97ad0`)

Why this is canonical:

- Initializes SDK-visible values for every existing environment.
- Keeps feature flag creation and environment values in one transaction.
- Avoids revision, ETag, and audit churn for no-op public value updates.
- Validates prerequisite flag references before saving SDK-visible rules.

Canonical feature flag service patterns from `apps/api/src/feature-flags/feature-flags.service.ts`.

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
if (existingValue && !this.hasPublicValueChange(existingValue, publicUpdate)) {
  return existingValue;
}
```

No-op public value updates must not bump revision, ETag, or audit.
