import type { BrowserContext, Page } from "@playwright/test";
import { createAuthenticatedUser } from "./auth";
import { apiBaseUrl, sessionCookieName } from "./env";

type CreateAuthenticatedBrowserUserInput = {
  email?: string;
  name?: string;
};

export async function addSessionCookie(context: BrowserContext, sessionToken: string) {
  await context.addCookies([
    {
      httpOnly: true,
      name: sessionCookieName,
      sameSite: "Strict",
      url: apiBaseUrl,
      value: sessionToken,
    },
  ]);
}

export async function createAuthenticatedBrowserUser(
  context: BrowserContext,
  input: CreateAuthenticatedBrowserUserInput = {},
) {
  const auth = await createAuthenticatedUser(input);
  await addSessionCookie(context, auth.sessionToken);

  return auth;
}

export function getPanel(page: Page, title: string) {
  return page.locator("section").filter({
    has: page.getByRole("heading", { level: 2, name: title }),
  });
}
