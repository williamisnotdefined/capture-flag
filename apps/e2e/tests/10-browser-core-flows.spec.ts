import { type APIRequestContext, type Page, expect, test } from "@playwright/test";
import { addSessionCookie, createAuthenticatedBrowserUser, getPanel } from "../support/browser";
import { disconnectDatabase } from "../support/db";
import { createFeatureFlagViaApi } from "../support/feature-flags";
import { resetDatabase } from "../support/reset";
import {
  type Config,
  type Environment,
  type Organization,
  type Project,
  createConfigViaApi,
  createCoreWorkspace,
  createEnvironmentViaApi,
} from "../support/workspace";

type BrowserWorkspace = {
  config: Config;
  environment: Environment;
  organization: Organization;
  project: Project;
  sessionToken: string;
};

const uuidPathSegment = "[0-9a-f-]{36}";

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await disconnectDatabase();
});

test("creates an organization and project through the browser UI", async ({ context, page }) => {
  await createAuthenticatedBrowserUser(context, {
    email: "browser-create@capture-flag.test",
    name: "Browser Create User",
  });

  await page.goto("/organizations");

  await expect(page.getByText("Browser Create User")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Organizacoes" })).toBeVisible();

  const organizationName = "Browser Flow Organization";
  const organizationPanel = getPanel(page, "Organizacoes");
  await organizationPanel.getByPlaceholder("Nova organizacao").fill(organizationName);
  await organizationPanel.getByRole("button", { name: "Criar" }).click();

  await expect(page).toHaveURL(new RegExp(`/organizations/${uuidPathSegment}$`));
  const organizationId = organizationIdFromUrl(page);
  await expect(page.getByLabel("Organizacao")).toHaveValue(organizationId);
  await expect(page.getByLabel("Organizacao")).toContainText(organizationName);

  await page.getByRole("link", { name: "Projetos" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Projetos" })).toBeVisible();

  const projectName = "Browser Flow Project";
  const projectsPanel = getPanel(page, "Projetos");
  await projectsPanel.getByPlaceholder("Novo projeto").fill(projectName);
  await projectsPanel.getByRole("button", { name: "Criar" }).click();

  await expect(page).toHaveURL(
    new RegExp(`/organizations/${organizationId}/projects/${uuidPathSegment}$`),
  );
  const projectId = projectIdFromUrl(page);
  await expect(page.getByLabel("Projeto")).toHaveValue(projectId);
  await expect(projectsPanel).toContainText(projectName);
});

test("loads a seeded workspace from a cold URL and preserves route context", async ({
  context,
  page,
  request,
}) => {
  const workspace = await createBrowserWorkspace(request, {
    configKey: "browser-cold-url-config",
    projectSlug: "browser-cold-url-project",
    userEmail: "browser-cold-url@capture-flag.test",
  });
  await createFeatureFlagViaApi(request, workspace.sessionToken, workspace.config.id, {
    defaultValue: false,
    key: "seededBrowserFlag",
    name: "Seeded Browser Flag",
    type: "boolean",
  });
  await addSessionCookie(context, workspace.sessionToken);

  await page.goto(
    `/organizations/${workspace.organization.id}/projects/${workspace.project.id}/configs/${workspace.config.id}/flags?environmentId=${workspace.environment.id}`,
  );

  await expect(page.getByRole("heading", { level: 1, name: "Flags" })).toBeVisible();
  await expect(page.locator("aside").getByText("browser-cold-url-project user")).toBeVisible();
  await expect(page.getByLabel("Organizacao")).toHaveValue(workspace.organization.id);
  await expect(page.getByLabel("Projeto")).toHaveValue(workspace.project.id);
  await expect(page.getByLabel("Config")).toHaveValue(workspace.config.id);
  await expect(page.getByLabel("Environment")).toHaveValue(workspace.environment.id);
  await expect(page.getByRole("button", { name: /Seeded Browser Flag/ })).toBeVisible();

  await page.getByRole("link", { name: "Configs" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Configs" })).toBeVisible();
  await expect(page).toHaveURL(
    new RegExp(
      `/organizations/${workspace.organization.id}/projects/${workspace.project.id}/configs/${workspace.config.id}$`,
    ),
  );
  await expect(page.getByLabel("Config")).toHaveValue(workspace.config.id);

  await page.getByRole("link", { name: "SDK Keys" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "SDK Keys" })).toBeVisible();
  await expect(page.getByLabel("Config")).toHaveValue(workspace.config.id);
  await expect(page.getByLabel("Environment")).toHaveValue(workspace.environment.id);

  const sdkKeysUrl = new URL(page.url());
  expect(sdkKeysUrl.searchParams.get("configId")).toBe(workspace.config.id);
  expect(sdkKeysUrl.searchParams.get("environmentId")).toBe(workspace.environment.id);
});

test("creates environment, config, flag, and published value through the browser UI", async ({
  context,
  page,
  request,
}) => {
  const { organization, project, sessionToken } = await createCoreWorkspace(request, {
    organizationName: "Browser UI Resource Org",
    organizationSlug: "browser-ui-resource-org",
    projectName: "Browser UI Resource Project",
    projectSlug: "browser-ui-resource-project",
    userEmail: "browser-ui-resources@capture-flag.test",
    userName: "Browser UI Resource User",
  });
  await addSessionCookie(context, sessionToken);

  await page.goto(`/organizations/${organization.id}/projects/${project.id}/environments`);
  await expect(page.getByRole("heading", { level: 1, name: "Environments" })).toBeVisible();

  const environmentName = "Browser Production";
  const environmentPanel = getPanel(page, "Ambientes");
  await environmentPanel.getByPlaceholder("production").fill(environmentName);
  await environmentPanel.getByRole("button", { name: "Criar" }).click();
  await expect(environmentPanel).toContainText("Browser Production (browser-production)");
  await expect(page.getByLabel("Environment")).toContainText(
    "Browser Production (browser-production)",
  );

  await page.getByRole("link", { name: "Configs" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Configs" })).toBeVisible();

  const configName = "Browser Flow Config";
  const configOptionLabel = `${configName} (browser-flow-config)`;
  const configsPanel = getPanel(page, "Configs");
  await configsPanel.getByPlaceholder("Nova config").fill(configName);
  await configsPanel.getByRole("button", { name: "Criar" }).click();
  await expect(configsPanel).toContainText(configOptionLabel);
  await configsPanel.locator("select").selectOption({ label: configOptionLabel });
  await expect(page).toHaveURL(
    new RegExp(
      `/organizations/${organization.id}/projects/${project.id}/configs/${uuidPathSegment}$`,
    ),
  );
  const configId = configIdFromUrl(page);
  await expect(page.getByLabel("Config")).toHaveValue(configId);

  await page.getByRole("link", { name: "Flags" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Flags" })).toBeVisible();

  const flagsPanel = getPanel(page, "Flags");
  await flagsPanel.getByPlaceholder("newCheckout").fill("browserFlag");
  await flagsPanel.getByPlaceholder("Nome da flag").fill("Browser Flag");
  await flagsPanel.getByRole("button", { name: "Criar flag" }).click();
  await expect(page.getByRole("button", { name: /Browser Flag/ })).toBeVisible();

  const valueForm = page.locator("form").filter({ hasText: `Valor em ${environmentName}` });
  await expect(valueForm).toBeVisible();
  await valueForm.locator("select").first().selectOption("true");
  await valueForm.getByRole("button", { name: "Salvar valor" }).click();
  await expect(page.getByText("default: true")).toBeVisible();

  await page.getByRole("link", { name: "Configs" }).click();
  const previewPanel = getPanel(page, "JSON Preview");
  await expect(previewPanel.locator("pre")).toContainText('"browserFlag"');
  await expect(previewPanel.locator("pre")).toContainText('"defaultValue": true');
});

test("loads the authenticated shell on a mobile viewport", async ({ context, page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await createAuthenticatedBrowserUser(context, {
    email: "browser-mobile@capture-flag.test",
    name: "Browser Mobile User",
  });

  await page.goto("/organizations");

  await expect(page.getByText("Browser Mobile User")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Organizacoes" })).toBeVisible();
  await expect(page.getByText("Capture Flag")).toBeVisible();
});

async function createBrowserWorkspace(
  request: APIRequestContext,
  input: { configKey: string; projectSlug: string; userEmail: string },
): Promise<BrowserWorkspace> {
  const { organization, project, sessionToken } = await createCoreWorkspace(request, {
    organizationName: `${input.projectSlug} org`,
    organizationSlug: `${input.projectSlug}-org`,
    projectName: `${input.projectSlug} project`,
    projectSlug: input.projectSlug,
    userEmail: input.userEmail,
    userName: `${input.projectSlug} user`,
  });
  const environment = await createEnvironmentViaApi(request, sessionToken, project.id, {
    key: "production",
    name: "Production",
  });
  const config = await createConfigViaApi(request, sessionToken, project.id, {
    key: input.configKey,
    name: input.configKey,
  });

  return { config, environment, organization, project, sessionToken };
}

function organizationIdFromUrl(page: Page) {
  return pathSegmentFromUrl(page, /^\/organizations\/([^/]+)/, "organization id");
}

function projectIdFromUrl(page: Page) {
  return pathSegmentFromUrl(page, /^\/organizations\/[^/]+\/projects\/([^/]+)/, "project id");
}

function configIdFromUrl(page: Page) {
  return pathSegmentFromUrl(
    page,
    /^\/organizations\/[^/]+\/projects\/[^/]+\/configs\/([^/]+)/,
    "config id",
  );
}

function pathSegmentFromUrl(page: Page, pattern: RegExp, label: string) {
  const match = new URL(page.url()).pathname.match(pattern);
  if (!match) {
    throw new Error(`Could not read ${label} from ${page.url()}`);
  }

  return match[1];
}
