export function createConfigEnvironmentEtag(
  configId: string,
  environmentId: string,
  revision: number,
): string {
  return `W/"cf-${revision}-${configId.slice(0, 8)}-${environmentId.slice(0, 8)}"`;
}
