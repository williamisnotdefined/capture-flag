import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  type RenderHookOptions,
  type RenderOptions,
  render,
  renderHook,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter, type MemoryRouterProps, Route, Routes } from "react-router-dom";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        retry: false,
      },
    },
  });
}

type ProviderOptions = {
  queryClient?: QueryClient;
  router?: MemoryRouterProps;
};

function createWrapper({ queryClient = createTestQueryClient(), router }: ProviderOptions = {}) {
  return function TestProviders({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter {...router}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

type RenderWithProvidersOptions = RenderOptions & ProviderOptions;

export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const queryClient = options.queryClient ?? createTestQueryClient();

  return {
    queryClient,
    ...render(ui, {
      ...options,
      wrapper: createWrapper({ queryClient, router: options.router }),
    }),
  };
}

type RenderRouteOptions = Omit<RenderWithProvidersOptions, "router"> & {
  path: string;
  route: string;
};

export function renderRouteWithProviders(ui: ReactElement, options: RenderRouteOptions) {
  return renderWithProviders(
    <Routes>
      <Route element={ui} path={options.path} />
      <Route element={null} path="*" />
    </Routes>,
    {
      ...options,
      router: { initialEntries: [options.route] },
    },
  );
}

type RenderHookWithProvidersOptions<TProps> = Omit<RenderHookOptions<TProps>, "wrapper"> &
  ProviderOptions;

export function renderHookWithProviders<TResult, TProps>(
  hook: (initialProps: TProps) => TResult,
  options: RenderHookWithProvidersOptions<TProps> = {},
) {
  const queryClient = options.queryClient ?? createTestQueryClient();

  return {
    queryClient,
    ...renderHook(hook, {
      ...options,
      wrapper: createWrapper({ queryClient, router: options.router }),
    }),
  };
}
