import { AuditLogsPanel } from "@pages/AuditLogsPage/AuditLogsPanel";
import { ConfigPreviewPanel } from "@pages/ConfigsPage/ConfigPreviewPanel";
import { ConfigsPanel } from "@pages/ConfigsPage/ConfigsPanel";
import { EnvironmentsPanel } from "@pages/EnvironmentsPage/EnvironmentsPanel";
import { OrganizationMembersSection } from "@pages/OrganizationsPage/OrganizationMembersSection";
import { OrganizationPanel } from "@pages/OrganizationsPage/OrganizationPanel";
import { ProjectMembersSection } from "@pages/ProjectsPage/ProjectMembersSection";
import { ProjectPanel, ProjectsPanel } from "@pages/ProjectsPage/ProjectsPanel";
import { auditLogsRoute, defaultProjectRoute, flagsRoute } from "@stories/mockData";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  parameters: { layout: "fullscreen" },
  title: "Pages/Panels",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Configs: Story = {
  parameters: { router: { initialEntries: [defaultProjectRoute] } },
  render: () => (
    <div className="grid gap-6 p-6 xl:grid-cols-2">
      <ConfigsPanel />
      <ConfigPreviewPanel />
    </div>
  ),
};

export const Environments: Story = {
  parameters: { router: { initialEntries: [defaultProjectRoute] } },
  render: () => (
    <div className="p-6">
      <EnvironmentsPanel />
    </div>
  ),
};

export const AuditLogs: Story = {
  parameters: { router: { initialEntries: [auditLogsRoute] } },
  render: () => (
    <div className="p-6">
      <AuditLogsPanel />
    </div>
  ),
};

export const Organization: Story = {
  parameters: { router: { initialEntries: ["/organizations/org_acme"] } },
  render: () => (
    <div className="grid gap-6 p-6">
      <OrganizationPanel />
      <OrganizationMembersSection />
    </div>
  ),
};

export const Projects: Story = {
  parameters: { router: { initialEntries: ["/organizations/org_acme/projects"] } },
  render: () => (
    <div className="p-6">
      <ProjectsPanel />
    </div>
  ),
};

export const ProjectDetail: Story = {
  parameters: { router: { initialEntries: [flagsRoute] } },
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <ProjectPanel />
      <ProjectMembersSection />
    </div>
  ),
};
