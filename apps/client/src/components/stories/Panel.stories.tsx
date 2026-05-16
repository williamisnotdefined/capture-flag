import { Panel } from "@components/Panel";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  argTypes: {
    children: { control: "text" },
    className: { control: "text" },
    showTitle: { control: "boolean" },
    title: { control: "text" },
    wide: { control: "boolean" },
  },
  args: {
    children: "Painel reutilizavel para secoes da plataforma.",
    showTitle: true,
    title: "Projeto selecionado",
    wide: false,
  },
  component: Panel,
  title: "Components/Panel",
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Wide: Story = {
  args: {
    wide: true,
  },
};
