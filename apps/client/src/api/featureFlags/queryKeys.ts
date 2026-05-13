export const featureFlagQueryKeys = {
  list: (configId: string) => ["featureFlags", configId] as const,
};
