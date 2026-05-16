import { CreatedSdkKeyNotice } from "@pages/SdkKeysPage/CreatedSdkKeyNotice";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    onCopyPublicConfigUrl: { action: "copied public config URL" },
    onCopySdkKey: { action: "copied SDK key" },
    publicConfigUrl: { control: "text" },
    publicConfigUrlCopyMessage: { control: "text" },
    sdkKey: { control: "text" },
    sdkKeyCopyMessage: { control: "text" },
  },
  args: {
    onCopyPublicConfigUrl: fn(),
    onCopySdkKey: fn(),
    publicConfigUrl: "http://localhost:3000/public-api/v1/sdk/cf_prod_abc123/config",
    publicConfigUrlCopyMessage: "",
    sdkKey: "cf_prod_abc123_full_storybook_key",
    sdkKeyCopyMessage: "",
  },
  component: CreatedSdkKeyNotice,
  title: "Pages/SdkKeys/CreatedSdkKeyNotice",
} satisfies Meta<typeof CreatedSdkKeyNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Copied: Story = {
  args: {
    publicConfigUrlCopyMessage: "URL copiada.",
    sdkKeyCopyMessage: "Chave copiada.",
  },
};
