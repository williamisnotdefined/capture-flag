import { Button } from "@components/Button";
import { PageHeader } from "@components/PageHeader";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  argTypes: {
    actions: { control: false },
    description: { control: "text" },
    eyebrow: { control: "text" },
    title: { control: "text" },
  },
  args: {
    actions: <Button type="button">Criar flag</Button>,
    description: "Crie, filtre e edite flags por config.",
    eyebrow: "Config selecionada",
    title: "Flags",
  },
  component: PageHeader,
  title: "Components/PageHeader",
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
