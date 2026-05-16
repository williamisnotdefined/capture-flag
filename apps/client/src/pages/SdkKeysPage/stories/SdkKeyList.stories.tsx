import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { storySdkKeys } from "../../../stories/mockData";
import { SdkKeyList } from "../SdkKeyList";

const meta = {
  argTypes: {
    canManageProjectResources: { control: "boolean" },
    isFetching: { control: "boolean" },
    isMutating: { control: "boolean" },
    onRevoke: { action: "revoked" },
    onRotate: { action: "rotated" },
    sdkKeys: { control: "object" },
  },
  args: {
    canManageProjectResources: true,
    isFetching: false,
    isMutating: false,
    onRevoke: fn(),
    onRotate: fn(),
    sdkKeys: storySdkKeys,
  },
  component: SdkKeyList,
  title: "Pages/SdkKeys/SdkKeyList",
} satisfies Meta<typeof SdkKeyList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithKeys: Story = {};

export const ReadOnly: Story = {
  args: {
    canManageProjectResources: false,
  },
};

export const Empty: Story = {
  args: {
    sdkKeys: [],
  },
};
