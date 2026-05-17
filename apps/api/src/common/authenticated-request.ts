import type { Request } from "express";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string | null;
  sessionId: string;
};

export type ApiTokenRequestContext = {
  id: string;
  organizationId: string;
  projectId: string | null;
  scopes: string[];
  tokenPrefix: string;
  userId: string;
};

export type AuthenticatedRequest = Request & {
  apiToken?: ApiTokenRequestContext;
  user: AuthenticatedUser;
};
