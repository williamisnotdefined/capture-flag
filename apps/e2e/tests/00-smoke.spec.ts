import { expect, test } from "@playwright/test";
import { apiUrl } from "../support/api";
import { createAuthenticatedUser, hashToken, sessionCookieHeader } from "../support/auth";
import { disconnectDatabase, prisma } from "../support/db";
import { apiBaseUrl, sessionCookieName } from "../support/env";
import { resetDatabase } from "../support/reset";

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await disconnectDatabase();
});

test("returns API health", async ({ request }) => {
  const response = await request.get(apiUrl("/health"));

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({ ok: true, service: "capture-flag-api" });
});

test("rejects current user without a session", async ({ request }) => {
  const response = await request.get(apiUrl("/api/v1/auth/me"));

  expect(response.status()).toBe(401);
});

test("returns current user with an E2E session", async ({ request }) => {
  const { sessionToken, user } = await createAuthenticatedUser({
    email: "current-user@capture-flag.test",
    name: "Current User",
  });

  const response = await request.get(apiUrl("/api/v1/auth/me"), {
    headers: {
      cookie: sessionCookieHeader(sessionToken),
    },
  });

  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload).toMatchObject({
    organizations: [],
    user: {
      avatarUrl: null,
      email: "current-user@capture-flag.test",
      id: user.id,
      name: "Current User",
    },
  });
  expect(payload.user.sessionId).toEqual(expect.any(String));
});

test("logout revokes an E2E session", async ({ request }) => {
  const { sessionToken } = await createAuthenticatedUser();

  const logoutResponse = await request.post(apiUrl("/api/v1/auth/logout"), {
    headers: {
      cookie: sessionCookieHeader(sessionToken),
    },
  });
  expect(logoutResponse.ok()).toBe(true);
  await expect(logoutResponse.json()).resolves.toEqual({ ok: true });

  const revokedSession = await prisma.session.findUnique({
    where: {
      tokenHash: hashToken(sessionToken),
    },
  });
  expect(revokedSession?.revokedAt).toBeInstanceOf(Date);

  const meResponse = await request.get(apiUrl("/api/v1/auth/me"), {
    headers: {
      cookie: sessionCookieHeader(sessionToken),
    },
  });
  expect(meResponse.status()).toBe(401);
});

test("loads the login page in the browser", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Fundacao da plataforma" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar com GitHub" })).toHaveAttribute(
    "href",
    `${apiBaseUrl}/api/v1/auth/github/start`,
  );
});

test("loads the authenticated platform shell in the browser", async ({ context, page }) => {
  const { sessionToken } = await createAuthenticatedUser({
    email: "browser-user@capture-flag.test",
    name: "Browser User",
  });

  await context.addCookies([
    {
      httpOnly: true,
      name: sessionCookieName,
      sameSite: "Strict",
      url: apiBaseUrl,
      value: sessionToken,
    },
  ]);

  await page.goto("/organizations");

  await expect(page.getByText("Browser User")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Organizacoes" })).toBeVisible();
});
