export const organizationQueryKeys = {
  members: (organizationId: string) => ["organizationMembers", organizationId] as const,
};
