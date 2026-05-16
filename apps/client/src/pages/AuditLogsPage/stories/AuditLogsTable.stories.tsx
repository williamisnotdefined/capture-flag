import { AuditLogsTable } from "@pages/AuditLogsPage/AuditLogsTable";
import { storyAuditLogs } from "@stories/mockData";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  argTypes: {
    emptyMessage: { control: "text" },
    entries: { control: "object" },
    isFetching: { control: "boolean" },
  },
  args: {
    emptyMessage: "Nenhum audit log encontrado para os filtros atuais.",
    entries: storyAuditLogs,
    isFetching: false,
  },
  component: AuditLogsTable,
  title: "Pages/AuditLogs/AuditLogsTable",
} satisfies Meta<typeof AuditLogsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEntries: Story = {};

export const Empty: Story = {
  args: {
    entries: [],
  },
};

export const Loading: Story = {
  args: {
    entries: [],
    isFetching: true,
  },
};
