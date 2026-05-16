import { FeatureFlagMetadataForm } from "@pages/FlagsPage/featureFlags/FeatureFlagMetadataForm";
import { storyFeatureFlags, storyMemberTargetOptions } from "@stories/mockData";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    canEditMetadata: { control: "boolean" },
    flag: { control: "object" },
    isPending: { control: "boolean" },
    onSubmit: { action: "submitted" },
    ownerOptions: { control: "object" },
  },
  args: {
    canEditMetadata: true,
    flag: storyFeatureFlags[0],
    isPending: false,
    onSubmit: fn(async () => undefined),
    ownerOptions: storyMemberTargetOptions,
  },
  component: FeatureFlagMetadataForm,
  title: "Pages/Flags/FeatureFlagMetadataForm",
} satisfies Meta<typeof FeatureFlagMetadataForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editable: Story = {};

export const ReadOnly: Story = {
  args: {
    canEditMetadata: false,
  },
};
