import { PlatformLayout } from "@layouts/PlatformLayout/PlatformLayout";
import { flagsRoute } from "@stories/mockData";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Route, Routes } from "react-router-dom";

const meta = {
  component: PlatformLayout,
  parameters: {
    layout: "fullscreen",
    router: { initialEntries: [flagsRoute] },
  },
  title: "Layouts/PlatformLayout/PlatformLayout",
} satisfies Meta<typeof PlatformLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shell: Story = {
  render: () => (
    <Routes>
      <Route
        element={<PlatformLayout />}
        path="/organizations/:organizationId/projects/:projectId/configs/:configId/flags"
      >
        <Route
          index
          element={
            <div className="rounded-md border border-border bg-background p-4">
              Conteudo da rota dentro do layout.
            </div>
          }
        />
      </Route>
    </Routes>
  ),
};
