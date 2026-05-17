import { AccountPage } from "@pages/AccountPage";
import type { Meta, StoryObj } from "@storybook/react-vite";

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
