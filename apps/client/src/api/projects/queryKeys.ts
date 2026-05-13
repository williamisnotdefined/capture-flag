export const projectQueryKeys = {
  list: (organizationId: string) => ["projects", organizationId] as const,
  members: (projectId: string) => ["projectMembers", projectId] as const,
};
