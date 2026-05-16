import {
  storyAuditLogs,
  storyConfigPreview,
  storyConfigs,
  storyEnvironments,
  storyFeatureFlags,
  storyMe,
  storyOrganizationMembers,
  storyOrganizations,
  storyProjectMembers,
  storyProjects,
  storySdkKeys,
  storySegments,
} from "./mockData";

let isInstalled = false;

export function installStorybookApiMock() {
  if (isInstalled || typeof window === "undefined") {
    return;
  }

  isInstalled = true;
  const originalFetch = window.fetch.bind(window);
  window.confirm = () => true;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = toUrl(input);
    if (!url || !url.pathname.startsWith("/api/v1")) {
      return originalFetch(input, init);
    }

    const path = url.pathname.replace(/^\/api\/v1/, "") || "/";
    const method = (init?.method ?? "GET").toUpperCase();
    const payload = resolveApiPayload(path, method);

    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };
}

function toUrl(input: RequestInfo | URL) {
  try {
    const rawUrl =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return new URL(rawUrl, window.location.origin);
  } catch {
    return null;
  }
}

function resolveApiPayload(path: string, method: string) {
  if (method === "DELETE") {
    return { ok: true };
  }

  if (path === "/auth/me") {
    return storyMe;
  }

  if (path === "/auth/logout") {
    return { ok: true };
  }

  if (path === "/organizations") {
    return method === "POST" ? storyOrganizations[0] : storyOrganizations;
  }

  if (/^\/organizations\/[^/]+\/projects$/.test(path)) {
    return method === "POST" ? storyProjects[0] : storyProjects;
  }

  if (/^\/organizations\/[^/]+\/members$/.test(path)) {
    return method === "POST" ? storyOrganizationMembers[1] : storyOrganizationMembers;
  }

  if (/^\/organizations\/[^/]+\/members\/[^/]+$/.test(path)) {
    return storyOrganizationMembers[1];
  }

  if (/^\/organizations\/[^/]+\/audit-logs$/.test(path)) {
    return { items: storyAuditLogs, nextCursor: null };
  }

  if (/^\/organizations\/[^/]+$/.test(path)) {
    return storyOrganizations[0];
  }

  if (/^\/projects\/[^/]+\/configs$/.test(path)) {
    return method === "POST" ? storyConfigs[0] : storyConfigs;
  }

  if (/^\/projects\/[^/]+\/environments$/.test(path)) {
    return method === "POST" ? storyEnvironments[0] : storyEnvironments;
  }

  if (/^\/projects\/[^/]+\/sdk-keys$/.test(path)) {
    return method === "POST"
      ? { ...storySdkKeys[0], key: "cf_prod_abc123_full_storybook_key" }
      : storySdkKeys;
  }

  if (/^\/projects\/[^/]+\/members$/.test(path)) {
    return method === "POST" ? storyProjectMembers[1] : storyProjectMembers;
  }

  if (/^\/projects\/[^/]+\/members\/[^/]+$/.test(path)) {
    return storyProjectMembers[1];
  }

  if (/^\/projects\/[^/]+$/.test(path)) {
    return storyProjects[0];
  }

  if (/^\/configs\/[^/]+\/environments\/[^/]+\/config-preview$/.test(path)) {
    return storyConfigPreview;
  }

  if (/^\/configs\/[^/]+\/feature-flags$/.test(path)) {
    return method === "POST" ? storyFeatureFlags[0] : storyFeatureFlags;
  }

  if (/^\/configs\/[^/]+\/feature-flags\/[^/]+\/activity$/.test(path)) {
    return { items: storyAuditLogs, nextCursor: null };
  }

  if (/^\/configs\/[^/]+\/feature-flags\/[^/]+\/environment-values$/.test(path)) {
    return storyFeatureFlags[0].environmentValues[0];
  }

  if (/^\/configs\/[^/]+\/feature-flags\/[^/]+$/.test(path)) {
    return storyFeatureFlags[0];
  }

  if (/^\/configs\/[^/]+\/segments$/.test(path)) {
    return method === "POST" ? storySegments[0] : storySegments;
  }

  if (/^\/configs\/[^/]+\/segments\/[^/]+$/.test(path)) {
    return storySegments[0];
  }

  if (/^\/sdk-keys\/[^/]+\/(rotate|revoke)$/.test(path)) {
    return { ...storySdkKeys[0], key: "cf_prod_rotated_storybook_key" };
  }

  return { ok: true };
}
