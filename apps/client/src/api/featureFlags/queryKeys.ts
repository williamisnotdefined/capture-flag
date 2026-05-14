export const featureFlagQueryKeys = {
  activity: (configId: string, featureFlagId: string) =>
    ["featureFlagActivity", configId, featureFlagId] as const,
  activityScope: (configId: string) => ["featureFlagActivity", configId] as const,
  list: (configId: string) => ["featureFlags", configId] as const,
};
