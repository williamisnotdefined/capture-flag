import type { Decorator, Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { installStorybookApiMock } from "../src/stories/storybookApiMock";
import "../src/styles.css";

installStorybookApiMock();

const withAppProviders: Decorator = (Story, context) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Number.POSITIVE_INFINITY,
      },
    },
  });
  const initialEntries = context.parameters.router?.initialEntries ?? ["/"];

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Story />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const preview: Preview = {
  decorators: [withAppProviders],
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
};

export default preview;
