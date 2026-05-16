import {
  ClickableTableRow,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/Table";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  component: Table,
  title: "Components/Table",
} satisfies Meta<typeof Table>;

export default meta;

export const Basic: StoryObj<typeof Table> = {
  render: () => (
    <Table>
      <TableCaption>Configs publicadas por ambiente.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Config</TableHead>
          <TableHead>Environment</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Default</TableCell>
          <TableCell>Production</TableCell>
          <TableCell>Ativa</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Checkout</TableCell>
          <TableCell>Staging</TableCell>
          <TableCell>Preview</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>2 configs</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const ClickableRow: StoryObj<typeof ClickableTableRow> = {
  argTypes: {
    activationRole: {
      control: "radio",
      options: ["button", "link"],
    },
    onActivate: { action: "activated" },
  },
  args: {
    activationRole: "button",
    onActivate: fn(),
  },
  render: (args) => (
    <Table>
      <TableBody>
        <ClickableTableRow {...args}>
          <TableCell>Selecione este recurso</TableCell>
          <TableCell className="text-muted-foreground">Pressione Enter ou clique</TableCell>
        </ClickableTableRow>
      </TableBody>
    </Table>
  ),
};
