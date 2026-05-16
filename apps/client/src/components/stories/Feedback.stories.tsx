import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorMessage } from "../ErrorMessage";
import { Eyebrow } from "../Eyebrow";
import { FieldError } from "../FieldError";
import { PermissionHint } from "../PermissionHint";

const meta = {
  title: "Components/Feedback",
} satisfies Meta;

export default meta;

export const EyebrowText: StoryObj<typeof Eyebrow> = {
  argTypes: {
    children: { control: "text" },
  },
  args: {
    children: "Compliance",
  },
  render: (args) => <Eyebrow {...args} />,
};

export const FieldErrorText: StoryObj<typeof FieldError> = {
  argTypes: {
    children: { control: "text" },
  },
  args: {
    children: "Informe um nome.",
  },
  render: (args) => <FieldError {...args} />,
};

export const ErrorMessageStory: StoryObj<typeof ErrorMessage> = {
  argTypes: {
    error: { control: "object" },
  },
  args: {
    error: new Error("Nao foi possivel carregar os dados."),
  },
  render: (args) => <ErrorMessage {...args} />,
};

export const Permission: StoryObj<typeof PermissionHint> = {
  argTypes: {
    children: { control: "text" },
  },
  args: {
    children: "Somente owner ou admin pode gerenciar membros.",
  },
  render: (args) => <PermissionHint {...args} />,
};
