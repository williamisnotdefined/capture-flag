import { Button } from "@components/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/Dialog";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  component: Dialog,
  title: "Components/Dialog",
} satisfies Meta<typeof Dialog>;

export default meta;

export const Default: StoryObj<typeof Dialog> = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">Abrir dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar SDK key</DialogTitle>
          <DialogDescription>
            Gere uma chave para a config e environment selecionados.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          O conteudo do dialog usa portal e overlay do Radix.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button">Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const InitiallyOpen: StoryObj<typeof Dialog> = {
  args: {
    defaultOpen: true,
  },
  render: (args) => (
    <Dialog {...args}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova config</DialogTitle>
          <DialogDescription>Informe o nome da config consumida pelos SDKs.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
};
