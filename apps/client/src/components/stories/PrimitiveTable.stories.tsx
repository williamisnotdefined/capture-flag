import {
  PrimitiveClickableTableRow,
  PrimitiveTable,
  PrimitiveTableBody,
  PrimitiveTableCaption,
  PrimitiveTableCell,
  PrimitiveTableFooter,
  PrimitiveTableHead,
  PrimitiveTableHeader,
  PrimitiveTableRow,
} from "@components/table";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  component: PrimitiveTable,
  title: "Components/Table/Primitives",
} satisfies Meta<typeof PrimitiveTable>;

export default meta;

export const Basic: StoryObj<typeof PrimitiveTable> = {
  render: () => (
    <PrimitiveTable>
      <PrimitiveTableCaption>Configs publicadas por ambiente.</PrimitiveTableCaption>
      <PrimitiveTableHeader>
        <PrimitiveTableRow>
          <PrimitiveTableHead>Config</PrimitiveTableHead>
          <PrimitiveTableHead>Environment</PrimitiveTableHead>
          <PrimitiveTableHead>Status</PrimitiveTableHead>
        </PrimitiveTableRow>
      </PrimitiveTableHeader>
      <PrimitiveTableBody>
        <PrimitiveTableRow>
          <PrimitiveTableCell>Default</PrimitiveTableCell>
          <PrimitiveTableCell>Production</PrimitiveTableCell>
          <PrimitiveTableCell>Ativa</PrimitiveTableCell>
        </PrimitiveTableRow>
        <PrimitiveTableRow>
          <PrimitiveTableCell>Checkout</PrimitiveTableCell>
          <PrimitiveTableCell>Staging</PrimitiveTableCell>
          <PrimitiveTableCell>Preview</PrimitiveTableCell>
        </PrimitiveTableRow>
      </PrimitiveTableBody>
      <PrimitiveTableFooter>
        <PrimitiveTableRow>
          <PrimitiveTableCell colSpan={3}>2 configs</PrimitiveTableCell>
        </PrimitiveTableRow>
      </PrimitiveTableFooter>
    </PrimitiveTable>
  ),
};

export const ClickableRow: StoryObj<typeof PrimitiveClickableTableRow> = {
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
    <PrimitiveTable>
      <PrimitiveTableBody>
        <PrimitiveClickableTableRow {...args}>
          <PrimitiveTableCell>Selecione este recurso</PrimitiveTableCell>
          <PrimitiveTableCell className="text-muted-foreground">
            Pressione Enter ou clique
          </PrimitiveTableCell>
        </PrimitiveClickableTableRow>
      </PrimitiveTableBody>
    </PrimitiveTable>
  ),
};
