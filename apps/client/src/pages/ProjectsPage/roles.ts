import type { ProjectRole } from "../../types";

export const projectRoles = [
  "project_admin",
  "developer",
  "viewer",
] as const satisfies readonly ProjectRole[];
