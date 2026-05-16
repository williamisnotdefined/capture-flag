import { Button } from "@components/Button";
import { DataToolbar, FilterSelect, SearchField } from "@components/DataToolbar";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  argTypes: {
    actions: { control: false },
    children: { control: false },
    className: { control: "text" },
  },
  component: DataToolbar,
  title: "Components/DataToolbar",
} satisfies Meta<typeof DataToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Toolbar: Story = {
  args: {
    actions: <Button type="button">Novo recurso</Button>,
    children: (
      <>
        <SearchField aria-label="Buscar" placeholder="Filter by name..." />
        <FilterSelect label="Status" valueLabel="Ativas">
          <option>Todos</option>
          <option>Ativas</option>
          <option>Arquivadas</option>
        </FilterSelect>
      </>
    ),
  },
};

export const Search: StoryObj<typeof SearchField> = {
  args: {
    placeholder: "Filter by key...",
  },
  render: (args) => <SearchField {...args} />,
};

export const Filter: StoryObj<typeof FilterSelect> = {
  argTypes: {
    label: { control: "text" },
    valueLabel: { control: "text" },
  },
  args: {
    label: "Environment",
    valueLabel: "Production",
  },
  render: (args) => (
    <FilterSelect {...args}>
      <option>Production</option>
      <option>Staging</option>
    </FilterSelect>
  ),
};
