import { AuditTimeline } from "@pages/AuditLogsPage/AuditTimeline";
import { storyAuditLogs } from "@stories/mockData";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  argTypes: {
    className: { control: "text" },
    description: { control: "text" },
    emptyMessage: { control: "text" },
    entries: { control: "object" },
    error: { control: "object" },
    isFetching: { control: "boolean" },
    title: { control: "text" },
  },
  args: {
    description: "Historico recente da flag e dos seus valores.",
    emptyMessage: "Sem atividade recente para esta flag.",
    entries: storyAuditLogs,
    error: null,
    isFetching: false,
    title: "Activity timeline",
  },
  component: AuditTimeline,
  title: "Pages/AuditLogs/AuditTimeline",
} satisfies Meta<typeof AuditTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEntries: Story = {};

export const Empty: Story = {
  args: {
    entries: [],
  },
};

export const Fetching: Story = {
  args: {
    isFetching: true,
  },
};

export const WithError: Story = {
  args: {
    error: new Error("Nao foi possivel carregar o historico."),
  },
};
