import { MemberList } from "@components/members/MemberList";
import { storyProjectMembers } from "@stories/mockData";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    canRemoveMember: { control: false },
    disabled: { control: "boolean" },
    emptyMessage: { control: "text" },
    getAvailableRoles: { control: false },
    members: { control: "object" },
    onRemoveMember: { action: "member removed" },
    onRoleChange: { action: "role changed" },
    roles: { control: "object" },
  },
  args: {
    disabled: false,
    emptyMessage: "Sem membros",
    members: storyProjectMembers,
    onRemoveMember: fn(),
    onRoleChange: fn(),
    roles: ["project_admin", "developer", "viewer"],
  },
  component: MemberList,
  title: "Components/Members/MemberList",
} satisfies Meta<typeof MemberList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editable: Story = {};

export const ReadOnly: Story = {
  args: {
    onRemoveMember: undefined,
    onRoleChange: undefined,
  },
};

export const Empty: Story = {
  args: {
    members: [],
  },
};
