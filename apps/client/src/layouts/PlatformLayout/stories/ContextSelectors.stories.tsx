import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { flagsRoute } from "../../../stories/mockData";
import { ContextSelectors } from "../ContextSelectors";
import { SidebarFrame } from "../SidebarShell";

const meta = {
  argTypes: {
    activeSection: {
      control: "select",
      options: [
        "audit",
        "configs",
        "environments",
        "flags",
        "organizations",
        "projects",
        "sdkKeys",
        "segments",
      ],
    },
    collapsed: { control: "boolean" },
    onNavigate: { action: "navigated" },
    scope: {
      control: "radio",
      options: ["project", "workspace"],
    },
  },
  args: {
    activeSection: "flags",
    collapsed: false,
    onNavigate: fn(),
    scope: "workspace",
  },
  component: ContextSelectors,
  parameters: {
    router: { initialEntries: [flagsRoute] },
  },
  title: "Layouts/PlatformLayout/ContextSelectors",
} satisfies Meta<typeof ContextSelectors>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Workspace: Story = {
  render: (args) => (
    <SidebarFrame panelState={args.collapsed ? "collapsed" : "expanded"}>
      <div className="w-64 bg-sidebar p-2 text-sidebar-foreground">
        <ContextSelectors {...args} />
      </div>
    </SidebarFrame>
  ),
};

export const Project: Story = {
  args: {
    scope: "project",
  },
  render: Workspace.render,
};
