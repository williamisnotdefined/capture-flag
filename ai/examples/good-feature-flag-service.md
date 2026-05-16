# Good Feature Flag Service

Source: `apps/api/src/feature-flags/use-cases/create-feature-flag.service.ts` (sha256: `47db2d21d3f128d512290b2efb82879ba2420d72572a9b69bd5fcab96bb36c0d`)
Source: `apps/api/src/feature-flags/use-cases/update-feature-flag-environment-value.service.ts` (sha256: `e47b9d57f52ed44d70f1b91c521b83321b5d85986b515d818559d2f3331b8eb8`)

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
if (existingValue && !this.support.hasPublicValueChange(existingValue, publicUpdate)) {
  return existingValue;
}
```

No-op public value updates must not bump revision, ETag, or audit.
