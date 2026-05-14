export const configQueryKeys = {
  list: (projectId: string) => ["configs", projectId] as const,
  preview: (configId: string, environmentId: string) =>
    ["configPreview", configId, environmentId] as const,
  previewScope: (configId: string) => ["configPreview", configId] as const,
};
