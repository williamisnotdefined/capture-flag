import type { Meta, StoryObj } from "@storybook/react-vite";
import { Folder } from "lucide-react";
import { fn } from "storybook/test";
import { storyProjects } from "../../stories/mockData";
import { ResourceSwitcher } from "../ResourceSwitcher";

const meta = {
  argTypes: {
    collapsed: { control: "boolean" },
    createDisabled: { control: "boolean" },
    createLabel: { control: "text" },
    disabled: { control: "boolean" },
    icon: { control: false },
    isActive: { control: "boolean" },
    label: { control: "text" },
    onChange: { action: "changed" },
    onCreate: { action: "create clicked" },
    onNavigate: { action: "navigated" },
    options: { control: "object" },
    path: { control: "text" },
    placeholder: { control: "text" },
    value: { control: "text" },
  },
  args: {
    collapsed: false,
    createDisabled: false,
    createLabel: "Criar projeto",
    disabled: false,
    icon: Folder,
    isActive: true,
    label: "Projeto",
    onChange: fn(),
    onCreate: fn(),
    onNavigate: fn(),
    options: storyProjects,
    path: "/organizations/org_acme/projects/project_console",
    placeholder: "Sem projetos",
    value: storyProjects[0].id,
  },
  component: ResourceSwitcher,
  title: "Components/ResourceSwitcher",
} satisfies Meta<typeof ResourceSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {};

export const Collapsed: Story = {
  args: {
    collapsed: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "",
  },
};
