import { CreateFeatureFlagForm } from "@pages/FlagsPage/featureFlags/CreateFeatureFlagForm";
import { storyMemberTargetOptions } from "@stories/mockData";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    canCreateFlag: { control: "boolean" },
    isPending: { control: "boolean" },
    onSubmit: { action: "submitted" },
    ownerOptions: { control: "object" },
  },
  args: {
    canCreateFlag: true,
    isPending: false,
    onSubmit: fn(async () => undefined),
    ownerOptions: storyMemberTargetOptions,
  },
  component: CreateFeatureFlagForm,
  title: "Pages/Flags/CreateFeatureFlagForm",
} satisfies Meta<typeof CreateFeatureFlagForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    canCreateFlag: false,
  },
};
