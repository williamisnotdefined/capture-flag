import { AccountPage } from "@pages/AccountPage";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

const meta = {
  component: AccountPage,
  parameters: {
    layout: "fullscreen",
    router: { initialEntries: ["/account"] },
  },
  title: "Pages/Account/AccountPage",
} satisfies Meta<typeof AccountPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AccountPage />
    </div>
  ),
};

export const DeleteDialogOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole("button", { name: "Excluir conta" }));
  },
  render: Default.render,
};
