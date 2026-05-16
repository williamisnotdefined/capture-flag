import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { flagsRoute } from "../../../../stories/mockData";
import { FeatureFlagsPanel } from "../FeatureFlagsPanel";

const meta = {
  argTypes: {
    isCreateOpen: { control: "boolean" },
    onCreateOpenChange: { action: "create open changed" },
  },
  args: {
    isCreateOpen: false,
    onCreateOpenChange: fn(),
  },
  component: FeatureFlagsPanel,
  parameters: {
    layout: "fullscreen",
    router: { initialEntries: [flagsRoute] },
  },
  title: "Pages/Flags/FeatureFlagsPanel",
} satisfies Meta<typeof FeatureFlagsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="p-6">
      <FeatureFlagsPanel {...args} />
    </div>
  ),
};

export const CreateOpen: Story = {
  args: {
    isCreateOpen: true,
  },
  render: Default.render,
};
