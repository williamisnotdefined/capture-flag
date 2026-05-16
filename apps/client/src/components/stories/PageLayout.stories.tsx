import { Button } from "@components/Button";
import { PageLayout } from "@components/PageLayout";
import { Panel } from "@components/Panel";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  argTypes: {
    actions: { control: false },
    children: { control: false },
    contentClassName: { control: "text" },
    description: { control: "text" },
    eyebrow: { control: "text" },
    title: { control: "text" },
  },
  args: {
    actions: <Button type="button">Nova config</Button>,
    children: (
      <Panel title="Resumo">
        <p className="text-sm text-muted-foreground">Conteudo da pagina renderizado aqui.</p>
      </Panel>
    ),
    description: "Configs agrupam flags e segmentos consumidos pelo SDK.",
    eyebrow: "Projeto selecionado",
    title: "Configs",
  },
  component: PageLayout,
  title: "Components/PageLayout",
} satisfies Meta<typeof PageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
