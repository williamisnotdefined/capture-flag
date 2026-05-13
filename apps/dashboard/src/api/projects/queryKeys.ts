export const projectQueryKeys = {
  list: (organizationId: string) => ["projects", organizationId] as const,
};
