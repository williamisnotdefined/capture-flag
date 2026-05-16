import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./db";
import { sessionCookieName } from "./env";

type CreateAuthenticatedUserInput = {
  email?: string;
  name?: string;
};

export async function createAuthenticatedUser(input: CreateAuthenticatedUserInput = {}) {
  const uniqueId = randomBytes(8).toString("hex");
  const user = await prisma.user.create({
    data: {
      avatarUrl: null,
      email: input.email ?? `e2e-${uniqueId}@capture-flag.test`,
      name: input.name ?? `E2E User ${uniqueId}`,
    },
  });
  const sessionToken = `sess_e2e_${randomBytes(32).toString("base64url")}`;
  const session = await prisma.session.create({
    data: {
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      tokenHash: hashToken(sessionToken),
      userId: user.id,
    },
  });

  return { session, sessionToken, user };
}

export function sessionCookieHeader(sessionToken: string) {
  return `${sessionCookieName}=${sessionToken}`;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
