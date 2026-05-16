import { Shell } from "@components/Shell";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  argTypes: {
    children: { control: "text" },
    title: { control: "text" },
  },
  args: {
    children: "Entre com GitHub para criar organizacoes, projetos e configs.",
    title: "Capture Flag",
  },
  component: Shell,
  title: "Components/Shell",
} satisfies Meta<typeof Shell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
