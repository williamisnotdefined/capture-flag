import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { storyMemberTargetOptions, storyProjectMembers } from "../../../stories/mockData";
import { MembersPanel } from "../MembersPanel";

const meta = {
  argTypes: {
    addError: { control: "object" },
    canRemoveMember: { control: false },
    disabled: { control: "boolean" },
    emptyMessage: { control: "text" },
    getAvailableRoles: { control: false },
    isManagingMembers: { control: "boolean" },
    isPending: { control: "boolean" },
    managementError: { control: "object" },
    members: { control: "object" },
    onRemoveMember: { action: "member removed" },
    onRoleChange: { action: "role changed" },
    onSubmit: { action: "submitted" },
    permissionHint: { control: "text" },
    queryError: { control: "object" },
    roles: { control: "object" },
    targetOptions: { control: "object" },
    targetPlaceholder: { control: "text" },
    title: { control: "text" },
  },
  args: {
    addError: null,
    disabled: false,
    emptyMessage: "Sem membros no projeto",
    isManagingMembers: false,
    isPending: false,
    managementError: null,
    members: storyProjectMembers,
    onRemoveMember: fn(),
    onRoleChange: fn(),
    onSubmit: fn(async () => undefined),
    permissionHint: undefined,
    queryError: null,
    roles: ["project_admin", "developer", "viewer"],
    targetOptions: storyMemberTargetOptions,
    targetPlaceholder: "Selecione um membro da organizacao",
    title: "Membros do projeto",
  },
  component: MembersPanel,
  title: "Components/Members/MembersPanel",
} satisfies Meta<typeof MembersPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PermissionLimited: Story = {
  args: {
    disabled: true,
    permissionHint: "Somente owner, admin ou project_admin pode conceder roles por projeto.",
  },
};

export const WithErrors: Story = {
  args: {
    addError: new Error("Usuario nao encontrado."),
    managementError: new Error("Role invalida."),
  },
};
