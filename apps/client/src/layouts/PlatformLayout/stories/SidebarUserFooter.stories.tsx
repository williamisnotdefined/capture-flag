import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { storyUser } from "../../../stories/mockData";
import { SidebarFrame } from "../SidebarShell";
import { SidebarUserFooter } from "../SidebarUserFooter";

const meta = {
  argTypes: {
    collapsed: { control: "boolean" },
    isLogoutPending: { control: "boolean" },
    onLogout: { action: "logout" },
    user: { control: "object" },
  },
  args: {
    collapsed: false,
    isLogoutPending: false,
    onLogout: fn(),
    user: storyUser,
  },
  component: SidebarUserFooter,
  title: "Layouts/PlatformLayout/SidebarUserFooter",
} satisfies Meta<typeof SidebarUserFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  render: (args) => (
    <SidebarFrame panelState={args.collapsed ? "collapsed" : "expanded"}>
      <div className="w-64 border border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarUserFooter {...args} />
      </div>
    </SidebarFrame>
  ),
};

export const Collapsed: Story = {
  args: {
    collapsed: true,
  },
  render: Expanded.render,
};
