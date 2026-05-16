import { SidebarFrame } from "@layouts/PlatformLayout/SidebarShell";
import { TopHeader } from "@layouts/PlatformLayout/TopHeader";
import { flagsRoute } from "@stories/mockData";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    onToggleSidebar: { action: "sidebar toggled" },
  },
  args: {
    onToggleSidebar: fn(),
  },
  component: TopHeader,
  parameters: {
    layout: "fullscreen",
    router: { initialEntries: [flagsRoute] },
  },
  title: "Layouts/PlatformLayout/TopHeader",
} satisfies Meta<typeof TopHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <SidebarFrame panelState="expanded">
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader {...args} />
      </div>
    </SidebarFrame>
  ),
};
