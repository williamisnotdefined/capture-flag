import { FeatureFlagList } from "@pages/FlagsPage/featureFlags/FeatureFlagList";
import { storyEnvironments, storyFeatureFlags } from "@stories/mockData";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    canManageFeatureFlags: { control: "boolean" },
    environmentId: { control: "text" },
    flags: { control: "object" },
    isDeleting: { control: "boolean" },
    isFetching: { control: "boolean" },
    onDelete: { action: "deleted" },
    onSelect: { action: "selected" },
    selectedFeatureFlagId: { control: "text" },
  },
  args: {
    canManageFeatureFlags: true,
    environmentId: storyEnvironments[0].id,
    flags: storyFeatureFlags,
    isDeleting: false,
    isFetching: false,
    onDelete: fn(),
    onSelect: fn(),
    selectedFeatureFlagId: storyFeatureFlags[0].id,
  },
  component: FeatureFlagList,
  title: "Pages/Flags/FeatureFlagList",
} satisfies Meta<typeof FeatureFlagList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFlags: Story = {};

export const Empty: Story = {
  args: {
    flags: [],
    selectedFeatureFlagId: "",
  },
};

export const ReadOnly: Story = {
  args: {
    canManageFeatureFlags: false,
  },
};
