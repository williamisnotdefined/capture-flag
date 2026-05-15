import { Navigate, createBrowserRouter } from "react-router-dom";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { ConfigsPage } from "./pages/ConfigsPage";
import { EnvironmentsPage } from "./pages/EnvironmentsPage";
import { FlagsPage } from "./pages/FlagsPage";
import { LoginPage } from "./pages/LoginPage";
import { OrganizationsPage } from "./pages/OrganizationsPage";
import { PlatformLayout } from "./pages/PlatformLayout";
import { ProjectsPage } from "./pages/ProjectsPage";
import { SdkKeysPage } from "./pages/SdkKeysPage";
import { SegmentsPage } from "./pages/SegmentsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <PlatformLayout />,
    children: [
      {
        path: "/",
        element: <Navigate to="/organizations" replace />,
      },
      {
        path: "/organizations",
        element: <OrganizationsPage />,
      },
      {
        path: "/organizations/:organizationId",
        element: <OrganizationsPage />,
      },
      {
        path: "/organizations/:organizationId/projects",
        element: <ProjectsPage />,
      },
      {
        path: "/organizations/:organizationId/projects/:projectId",
        element: <ProjectsPage />,
      },
      {
        path: "/organizations/:organizationId/projects/:projectId/environments",
        element: <EnvironmentsPage />,
      },
      {
        path: "/organizations/:organizationId/projects/:projectId/configs",
        element: <ConfigsPage />,
      },
      {
        path: "/organizations/:organizationId/projects/:projectId/configs/:configId",
        element: <ConfigsPage />,
      },
      {
        path: "/organizations/:organizationId/projects/:projectId/configs/:configId/flags",
        element: <FlagsPage />,
      },
      {
        path: "/organizations/:organizationId/projects/:projectId/configs/:configId/segments",
        element: <SegmentsPage />,
      },
      {
        path: "/organizations/:organizationId/projects/:projectId/sdk-keys",
        element: <SdkKeysPage />,
      },
      {
        path: "/organizations/:organizationId/audit-logs",
        element: <AuditLogsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
