import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  auditLogsRoute,
  defaultProjectRoute,
  flagsRoute,
  sdkKeysRoute,
  segmentsRoute,
} from "../../stories/mockData";
import { AuditLogsPage } from "../AuditLogsPage";
import { ConfigsPage } from "../ConfigsPage";
import { EnvironmentsPage } from "../EnvironmentsPage";
import { FlagsPage } from "../FlagsPage";
import { LoginPage } from "../LoginPage";
import { OrganizationEditPage, OrganizationsPage } from "../OrganizationsPage";
import { ProjectsPage } from "../ProjectsPage";
import { SdkKeysPage } from "../SdkKeysPage";
import { SegmentsPage } from "../SegmentsPage";

const meta = {
  parameters: { layout: "fullscreen" },
  title: "Pages/Routes",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const pageFrame = (children: React.ReactNode) => <div className="p-6">{children}</div>;

export const Login: Story = {
  parameters: { router: { initialEntries: ["/login"] } },
  render: () => <LoginPage />,
};

export const Organizations: Story = {
  parameters: { router: { initialEntries: ["/organizations"] } },
  render: () => pageFrame(<OrganizationsPage />),
};

export const OrganizationEdit: Story = {
  parameters: { router: { initialEntries: ["/organizations/org_acme"] } },
  render: () => pageFrame(<OrganizationEditPage />),
};

export const Projects: Story = {
  parameters: { router: { initialEntries: ["/organizations/org_acme/projects"] } },
  render: () => pageFrame(<ProjectsPage />),
};

export const ProjectEdit: Story = {
  parameters: { router: { initialEntries: ["/organizations/org_acme/projects/project_console"] } },
  render: () => pageFrame(<ProjectsPage />),
};

export const Environments: Story = {
  parameters: { router: { initialEntries: [defaultProjectRoute] } },
  render: () => pageFrame(<EnvironmentsPage />),
};

export const Configs: Story = {
  parameters: { router: { initialEntries: [defaultProjectRoute] } },
  render: () => pageFrame(<ConfigsPage />),
};

export const Flags: Story = {
  parameters: { router: { initialEntries: [flagsRoute] } },
  render: () => pageFrame(<FlagsPage />),
};

export const Segments: Story = {
  parameters: { router: { initialEntries: [segmentsRoute] } },
  render: () => pageFrame(<SegmentsPage />),
};

export const SdkKeys: Story = {
  parameters: { router: { initialEntries: [sdkKeysRoute] } },
  render: () => pageFrame(<SdkKeysPage />),
};

export const AuditLogs: Story = {
  parameters: { router: { initialEntries: [auditLogsRoute] } },
  render: () => pageFrame(<AuditLogsPage />),
};
