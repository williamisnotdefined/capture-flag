import { UpdateNameForm } from "@components/UpdateNameForm";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    disabled: { control: "boolean" },
    name: { control: "text" },
    onSubmit: { action: "submitted" },
  },
  args: {
    disabled: false,
    name: "Console Web",
    onSubmit: fn(async () => undefined),
  },
  component: UpdateNameForm,
  title: "Components/UpdateNameForm",
} satisfies Meta<typeof UpdateNameForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
