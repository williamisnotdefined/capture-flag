import { DataTablePagination } from "@components/DataTablePagination";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    onPageChange: { action: "page changed" },
    onPageSizeChange: { action: "page size changed" },
    page: { control: { min: 1, type: "number" } },
    pageSize: { control: { min: 1, type: "number" } },
    pageSizeOptions: { control: "object" },
    totalItems: { control: { min: 0, type: "number" } },
  },
  args: {
    onPageChange: fn(),
    onPageSizeChange: fn(),
    page: 3,
    pageSize: 10,
    pageSizeOptions: [10, 20, 50],
    totalItems: 96,
  },
  component: DataTablePagination,
  title: "Components/DataTablePagination",
} satisfies Meta<typeof DataTablePagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MiddlePage: Story = {};

export const FirstPage: Story = {
  args: {
    page: 1,
    totalItems: 14,
  },
};

export const LastPage: Story = {
  args: {
    page: 10,
    totalItems: 96,
  },
};
