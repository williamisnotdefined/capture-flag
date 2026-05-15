import type { ComponentType } from "react";
import { createBrowserRouter, redirect } from "react-router-dom";

function lazyRoute<TExport extends string, TModule extends Record<TExport, ComponentType>>(
  importer: () => Promise<TModule>,
  exportName: TExport,
) {
  return async () => {
    const module = await importer();

    return { Component: module[exportName] };
  };
}

export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/organizations"),
  },
  {
    path: "/login",
    lazy: lazyRoute(() => import("./pages/LoginPage"), "LoginPage"),
  },
  {
    lazy: lazyRoute(() => import("./pages/PlatformLayout"), "PlatformLayout"),
    children: [
      {
        path: "/organizations",
        lazy: lazyRoute(() => import("./pages/OrganizationsPage"), "OrganizationsPage"),
      },
      {
        path: "/organizations/:organizationId",
        lazy: lazyRoute(() => import("./pages/OrganizationsPage"), "OrganizationsPage"),
      },
      {
        path: "/organizations/:organizationId/projects",
        lazy: lazyRoute(() => import("./pages/ProjectsPage"), "ProjectsPage"),
      },
      {
        path: "/organizations/:organizationId/projects/:projectId",
        lazy: lazyRoute(() => import("./pages/ProjectsPage"), "ProjectsPage"),
      },
      {
        path: "/organizations/:organizationId/projects/:projectId/environments",
        lazy: lazyRoute(() => import("./pages/EnvironmentsPage"), "EnvironmentsPage"),
      },
      {
        path: "/organizations/:organizationId/projects/:projectId/configs",
        lazy: lazyRoute(() => import("./pages/ConfigsPage"), "ConfigsPage"),
      },
      {
        path: "/organizations/:organizationId/projects/:projectId/configs/:configId",
        lazy: lazyRoute(() => import("./pages/ConfigsPage"), "ConfigsPage"),
      },
      {
        path: "/organizations/:organizationId/projects/:projectId/configs/:configId/flags",
        lazy: lazyRoute(() => import("./pages/FlagsPage"), "FlagsPage"),
      },
      {
        path: "/organizations/:organizationId/projects/:projectId/configs/:configId/segments",
        lazy: lazyRoute(() => import("./pages/SegmentsPage"), "SegmentsPage"),
      },
      {
        path: "/organizations/:organizationId/projects/:projectId/sdk-keys",
        lazy: lazyRoute(() => import("./pages/SdkKeysPage"), "SdkKeysPage"),
      },
      {
        path: "/organizations/:organizationId/audit-logs",
        lazy: lazyRoute(() => import("./pages/AuditLogsPage"), "AuditLogsPage"),
      },
    ],
  },
  {
    path: "*",
    loader: () => redirect("/"),
  },
]);
