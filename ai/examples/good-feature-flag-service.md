# Good Feature Flag Service

Source: `apps/api/src/feature-flags/use-cases/create-feature-flag.service.ts` (sha256: `e3447019ab7377c435f4f4a6c46e5c29813e27e73520f9044656a9b4a5436f67`)
Source: `apps/api/src/feature-flags/use-cases/update-feature-flag-environment-value.service.ts` (sha256: `1f13a84f9a7190b566b4eb5dd0829f49c488cf9a6284b7c2f98c7e5c23ae4b2f`)

Why this is canonical:

- Initializes SDK-visible values for every existing environment.
- Keeps feature flag creation and environment values in one transaction.
- Avoids revision, ETag, and audit churn for no-op public value updates.
- Validates prerequisite flag references before saving SDK-visible rules.

Canonical feature flag service patterns from the feature flag use-case services.

## Creation Pattern

```ts
const config = await this.featureFlagAccess.findConfigForCreate(userId, configId);
const normalizedInput = await this.featureFlagCreateInput.normalize({
  input,
  organizationId: config.project.organizationId,
});

return this.prisma.$transaction(async (tx) => {
  const flag = await tx.featureFlag.create({
    data: {
      projectId: config.projectId,
      configId,
      key: normalizedInput.key,
      name: normalizedInput.name,
      description: normalizedInput.description,
      type: normalizedInput.type,
      initialDefaultValue: normalizedInput.defaultValue,
      tags: normalizedInput.tags,
      hint: normalizedInput.hint,
      ownerUserId: normalizedInput.ownerUserId,
    },
  });

  const environmentIds = await this.featureFlagEnvironmentValueInitializer.initialize(tx, {
    projectId: config.projectId,
    configId,
    featureFlagId: flag.id,
    defaultValue: normalizedInput.defaultValue,
    updatedByUserId: userId,
  });

  await this.featureFlagConfigState.bumpForFlagCreate(tx, {
    actorUserId: userId,
    configId,
    environmentIds,
    featureFlagId: flag.id,
    organizationId: config.project.organizationId,
    projectId: config.projectId,
  });

  await this.featureFlagAudit.writeFlagCreated(tx, {
    actorUserId: userId,
    environmentIds,
    flag,
    organizationId: config.project.organizationId,
  });
});
```

Creation initializes every existing environment with SDK-visible values.

## No-Op Value Update Pattern

```ts
const writeResult = await this.featureFlagEnvironmentValueWriter.write(tx, {
  createData: normalizedInput.createData,
  environmentId,
  featureFlagId,
  publicUpdate: normalizedInput.publicUpdate,
  updateData: normalizedInput.updateData,
});

if (!writeResult.didChange) {
  return writeResult.value;
}
```

No-op public value updates must not bump revision, ETag, or audit.
