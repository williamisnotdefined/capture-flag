export const environmentQueryKeys = {
  list: (projectId: string) => ["environments", projectId] as const,
};
