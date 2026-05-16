import { SegmentsPanel } from "@pages/SegmentsPage/segments/SegmentsPanel";
import { segmentsRoute } from "@stories/mockData";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    isCreateOpen: { control: "boolean" },
    onCreateOpenChange: { action: "create open changed" },
  },
  args: {
    isCreateOpen: false,
    onCreateOpenChange: fn(),
  },
  component: SegmentsPanel,
  parameters: {
    layout: "fullscreen",
    router: { initialEntries: [segmentsRoute] },
  },
  title: "Pages/Segments/SegmentsPanel",
} satisfies Meta<typeof SegmentsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="p-6">
      <SegmentsPanel {...args} />
    </div>
  ),
};

export const CreateOpen: Story = {
  args: {
    isCreateOpen: true,
  },
  render: Default.render,
};
