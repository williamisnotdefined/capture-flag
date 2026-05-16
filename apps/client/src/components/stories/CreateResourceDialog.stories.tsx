import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CreateResourceDialog } from "../CreateResourceDialog";

const meta = {
  argTypes: {
    description: { control: "text" },
    disabled: { control: "boolean" },
    error: { control: "object" },
    onOpenChange: { action: "open changed" },
    onSubmit: { action: "submitted" },
    open: { control: "boolean" },
    placeholder: { control: "text" },
    title: { control: "text" },
  },
  args: {
    description: "Informe o nome da config consumida pelos SDKs.",
    disabled: false,
    error: null,
    onOpenChange: fn(),
    onSubmit: fn(async () => undefined),
    open: true,
    placeholder: "Nova config",
    title: "Nova config",
  },
  component: CreateResourceDialog,
  title: "Components/CreateResourceDialog",
} satisfies Meta<typeof CreateResourceDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const WithError: Story = {
  args: {
    error: new Error("Nome ja esta em uso."),
  },
};
