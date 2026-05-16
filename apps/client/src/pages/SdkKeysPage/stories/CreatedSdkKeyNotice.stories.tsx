import { CreatedSdkKeyNotice } from "@pages/SdkKeysPage/CreatedSdkKeyNotice";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    copyMessage: { control: "text" },
    onCopy: { action: "copied" },
    publicConfigUrl: { control: "text" },
    sdkKey: { control: "text" },
  },
  args: {
    copyMessage: "",
    onCopy: fn(),
    publicConfigUrl: "http://localhost:3000/public-api/v1/sdk/cf_prod_abc123/config",
    sdkKey: "cf_prod_abc123_full_storybook_key",
  },
  component: CreatedSdkKeyNotice,
  title: "Pages/SdkKeys/CreatedSdkKeyNotice",
} satisfies Meta<typeof CreatedSdkKeyNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Copied: Story = {
  args: {
    copyMessage: "Chave copiada.",
  },
};
