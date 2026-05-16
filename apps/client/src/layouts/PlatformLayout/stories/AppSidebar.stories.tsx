import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { flagsRoute, storyUser } from "../../../stories/mockData";
import { AppSidebar } from "../AppSidebar";
import { SidebarFrame, SidebarInset } from "../SidebarShell";

const meta = {
  argTypes: {
    desktopOpen: { control: "boolean" },
    isLogoutPending: { control: "boolean" },
    mobileOpen: { control: "boolean" },
    onLogout: { action: "logout" },
    onMobileOpenChange: { action: "mobile open changed" },
    onToggleSidebar: { action: "sidebar toggled" },
    user: { control: "object" },
  },
  args: {
    desktopOpen: true,
    isLogoutPending: false,
    mobileOpen: false,
    onLogout: fn(),
    onMobileOpenChange: fn(),
    onToggleSidebar: fn(),
    user: storyUser,
  },
  component: AppSidebar,
  parameters: {
    layout: "fullscreen",
    router: { initialEntries: [flagsRoute] },
  },
  title: "Layouts/PlatformLayout/AppSidebar",
} satisfies Meta<typeof AppSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  render: (args) => (
    <SidebarFrame panelState={args.desktopOpen ? "expanded" : "collapsed"}>
      <AppSidebar {...args} />
      <SidebarInset className="p-6">Conteudo principal</SidebarInset>
    </SidebarFrame>
  ),
};

export const Collapsed: Story = {
  args: {
    desktopOpen: false,
  },
  render: Expanded.render,
};
