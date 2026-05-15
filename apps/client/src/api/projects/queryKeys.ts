export const projectQueryKeys = {
  all: ["projects"] as const,
  list: (organizationId: string) => ["projects", organizationId] as const,
  members: (projectId: string) => ["projectMembers", projectId] as const,
};
