import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil, Trash2 } from "lucide-react";
import { fn } from "storybook/test";
import { ActionMenu, ActionMenuItem, ActionMenuLink } from "../ActionMenu";

const meta = {
  argTypes: {
    children: { control: false },
    className: { control: "text" },
    label: { control: "text" },
  },
  args: {
    children: (
      <>
        <ActionMenuItem onClick={fn()}>
          <Pencil aria-hidden="true" className="h-4 w-4" />
          Editar
        </ActionMenuItem>
        <ActionMenuLink to="/organizations/org_acme/projects/project_console">
          Abrir projeto
        </ActionMenuLink>
        <ActionMenuItem destructive onClick={fn()}>
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          Excluir
        </ActionMenuItem>
      </>
    ),
    label: "Acoes do recurso",
  },
  component: ActionMenu,
  title: "Components/ActionMenu",
} satisfies Meta<typeof ActionMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Item: StoryObj<typeof ActionMenuItem> = {
  argTypes: {
    destructive: { control: "boolean" },
  },
  args: {
    children: "Remover",
    destructive: true,
  },
  render: (args) => (
    <ActionMenu label="Acoes">
      <ActionMenuItem {...args} />
    </ActionMenu>
  ),
};

export const LinkItem: StoryObj<typeof ActionMenuLink> = {
  argTypes: {
    destructive: { control: "boolean" },
    to: { control: "text" },
  },
  args: {
    children: "Abrir recurso",
    destructive: false,
    to: "/organizations/org_acme",
  },
  render: (args) => (
    <ActionMenu label="Acoes">
      <ActionMenuLink {...args} />
    </ActionMenu>
  ),
};
