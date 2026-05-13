export const configQueryKeys = {
  list: (projectId: string) => ["configs", projectId] as const,
};
