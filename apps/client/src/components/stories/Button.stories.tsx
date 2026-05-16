import type { Meta, StoryObj } from "@storybook/react-vite";
import { Settings } from "lucide-react";
import { Button } from "../Button";

const meta = {
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger", "ghost"],
    },
  },
  args: {
    children: "Salvar alteracoes",
    variant: "primary",
  },
  component: Button,
  title: "Components/Button",
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Settings aria-hidden="true" />
        Configurar
      </>
    ),
    variant: "secondary",
  },
};

export const Disabled: Story = {
  args: {
    children: "Processando",
    disabled: true,
  },
};
