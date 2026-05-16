import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  storyBooleanFlagValue,
  storyEnvironments,
  storyFeatureFlags,
  storySegments,
} from "../../../../stories/mockData";
import { FeatureFlagValueForm } from "../FeatureFlagValueForm";

const meta = {
  argTypes: {
    canEditValue: { control: "boolean" },
    environmentId: { control: "text" },
    environmentName: { control: "text" },
    flag: { control: "object" },
    flags: { control: "object" },
    isPending: { control: "boolean" },
    mutationError: { control: "object" },
    onSubmit: { action: "submitted" },
    segments: { control: "object" },
    value: { control: "object" },
  },
  args: {
    canEditValue: true,
    environmentId: storyEnvironments[0].id,
    environmentName: storyEnvironments[0].name,
    flag: storyFeatureFlags[0],
    flags: storyFeatureFlags,
    isPending: false,
    mutationError: null,
    onSubmit: fn(async () => undefined),
    segments: storySegments,
    value: storyBooleanFlagValue,
  },
  component: FeatureFlagValueForm,
  title: "Pages/Flags/FeatureFlagValueForm",
} satisfies Meta<typeof FeatureFlagValueForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BooleanValue: Story = {};

export const JsonObjectValue: Story = {
  args: {
    flag: storyFeatureFlags[2],
    value: undefined,
  },
};

export const MissingEnvironment: Story = {
  args: {
    canEditValue: false,
    environmentId: "",
    environmentName: undefined,
    value: undefined,
  },
};

export const WithError: Story = {
  args: {
    mutationError: new Error("Nao foi possivel salvar o valor."),
  },
};
