export function formatResourceLabel(resource: { key?: string; name: string }) {
  return resource.key ? `${resource.name} (${resource.key})` : resource.name;
}
