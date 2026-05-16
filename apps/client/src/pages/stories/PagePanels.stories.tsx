import type { Meta, StoryObj } from "@storybook/react-vite";
import { auditLogsRoute, defaultProjectRoute, flagsRoute } from "../../stories/mockData";
import { AuditLogsPanel } from "../AuditLogsPage/AuditLogsPanel";
import { ConfigPreviewPanel } from "../ConfigsPage/ConfigPreviewPanel";
import { ConfigsPanel } from "../ConfigsPage/ConfigsPanel";
import { EnvironmentsPanel } from "../EnvironmentsPage/EnvironmentsPanel";
import { OrganizationMembersSection } from "../OrganizationsPage/OrganizationMembersSection";
import { OrganizationPanel } from "../OrganizationsPage/OrganizationPanel";
import { ProjectMembersSection } from "../ProjectsPage/ProjectMembersSection";
import { ProjectPanel, ProjectsPanel } from "../ProjectsPage/ProjectsPanel";

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
