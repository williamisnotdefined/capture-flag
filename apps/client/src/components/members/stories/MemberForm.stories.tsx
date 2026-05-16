import { MemberForm } from "@components/members/MemberForm";
import { storyMemberTargetOptions } from "@stories/mockData";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    disabled: { control: "boolean" },
    isPending: { control: "boolean" },
    onSubmit: { action: "submitted" },
    roles: { control: "object" },
    targetOptions: { control: "object" },
    targetPlaceholder: { control: "text" },
  },
  args: {
    disabled: false,
    isPending: false,
    onSubmit: fn(async () => undefined),
    roles: ["owner", "admin", "member", "viewer"],
    targetOptions: undefined,
    targetPlaceholder: "email do usuario",
  },
  component: MemberForm,
  title: "Components/Members/MemberForm",
} satisfies Meta<typeof MemberForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmailTarget: Story = {};

export const SelectTarget: Story = {
  args: {
    roles: ["project_admin", "developer", "viewer"],
    targetOptions: storyMemberTargetOptions,
    targetPlaceholder: "Selecione um membro da organizacao",
  },
};

export const Pending: Story = {
  args: {
    isPending: true,
  },
};
