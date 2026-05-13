import type { Request } from "express";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  sessionId: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
