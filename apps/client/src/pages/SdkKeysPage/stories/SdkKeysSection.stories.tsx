import { SdkKeysSection } from "@pages/SdkKeysPage/SdkKeysSection";
import { sdkKeysRoute } from "@stories/mockData";
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
  component: SdkKeysSection,
  parameters: {
    layout: "fullscreen",
    router: { initialEntries: [sdkKeysRoute] },
  },
  title: "Pages/SdkKeys/SdkKeysSection",
} satisfies Meta<typeof SdkKeysSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="p-6">
      <SdkKeysSection {...args} />
    </div>
  ),
};

export const CreateOpen: Story = {
  args: {
    isCreateOpen: true,
  },
  render: Default.render,
};
