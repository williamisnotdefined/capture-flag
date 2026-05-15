export const apiTokenScopes = [
  "projects:read",
  "projects:write",
  "configs:read",
  "configs:write",
  "members:read",
  "members:write",
  "flags:read",
  "flags:write",
  "environments:read",
  "segments:read",
  "segments:write",
] as const;

export type ApiTokenScope = (typeof apiTokenScopes)[number];

export function isApiTokenScope(value: unknown): value is ApiTokenScope {
  return typeof value === "string" && apiTokenScopes.includes(value as ApiTokenScope);
}
