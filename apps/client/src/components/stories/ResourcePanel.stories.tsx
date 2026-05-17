import { ResourcePanel } from "@components/ResourcePanel";
import { storyConfigs } from "@stories/mockData";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    canEditName: { control: "boolean" },
    deleteDisabled: { control: "boolean" },
    deleteLabel: { control: "text" },
    emptyMessage: { control: "text" },
    items: { control: "object" },
    mutationError: { control: "object" },
    onBulkDelete: { action: "bulk deleted" },
    onDelete: { action: "deleted" },
    onRename: { action: "renamed" },
    onSelect: { action: "selected" },
    permissionHint: { control: "text" },
    queryError: { control: "object" },
    selectedId: { control: "text" },
    title: { control: "text" },
  },
  args: {
    canEditName: true,
    deleteDisabled: false,
    deleteLabel: "Excluir",
    emptyMessage: "Sem configs",
    items: storyConfigs,
    mutationError: null,
    onRename: fn(),
    onSelect: fn(),
    permissionHint: undefined,
    queryError: null,
    selectedId: storyConfigs[0].id,
    title: "Configs",
  },
  component: ResourcePanel,
  title: "Components/ResourcePanel",
} satisfies Meta<typeof ResourcePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithItems: Story = {};

export const Empty: Story = {
  args: {
    items: [],
    selectedId: "",
  },
};

export const PermissionLimited: Story = {
  args: {
    permissionHint: "Voce nao tem permissao para criar configs neste projeto.",
  },
};

export const WithDeleteActions: Story = {
  args: {
    onBulkDelete: fn(),
    onDelete: fn(),
  },
};
