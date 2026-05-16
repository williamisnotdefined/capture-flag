import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CreateNameForm } from "../CreateNameForm";

const meta = {
  argTypes: {
    disabled: { control: "boolean" },
    dividedFooter: { control: "boolean" },
    onSubmit: { action: "submitted" },
    placeholder: { control: "text" },
  },
  args: {
    disabled: false,
    dividedFooter: false,
    onSubmit: fn(async () => undefined),
    placeholder: "Nova config",
  },
  component: CreateNameForm,
  title: "Components/CreateNameForm",
} satisfies Meta<typeof CreateNameForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};

export const DividedFooter: Story = {
  args: {
    dividedFooter: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
