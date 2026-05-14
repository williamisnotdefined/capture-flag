import type { CaptureFlagClient, CaptureFlagConfigChangeListener } from "@capture-flag/sdk-js";
import { type ReactNode, act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaptureFlagProvider, useFeatureFlag } from "../src";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const mountedRoots: Root[] = [];

type TestCaptureFlagClient = CaptureFlagClient & {
  emitConfigChange(): void;
  listenerCount(): number;
};

function createClient(getValue: ReturnType<typeof vi.fn>): TestCaptureFlagClient {
  const listeners = new Set<CaptureFlagConfigChangeListener>();

  return {
    close: vi.fn(),
    emitConfigChange() {
      for (const listener of Array.from(listeners)) {
        listener();
      }
    },
    getValue,
    listenerCount() {
      return listeners.size;
    },
    refresh: vi.fn(),
    subscribe: vi.fn((listener: CaptureFlagConfigChangeListener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    }),
  };
}

function mountWithRoot(element: ReactNode): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mountedRoots.push(root);

  act(() => {
    root.render(element);
  });

  return { container, root };
}

function mount(element: ReactNode): HTMLElement {
  return mountWithRoot(element).container;
}

async function flushPromises(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

afterEach(() => {
  for (const root of mountedRoots) {
    act(() => {
      root.unmount();
    });
  }

  mountedRoots.length = 0;
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("CaptureFlagProvider", () => {
  it("returns fallback first and then updates with the resolved flag value", async () => {
    let resolveValue: (value: boolean) => void = () => undefined;
    const getValue = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveValue = resolve;
        }),
    );
    const client = createClient(getValue);

    function Example() {
      const enabled = useFeatureFlag("newCheckout", false);
      return <span>{String(enabled)}</span>;
    }

    const container = mount(
      <CaptureFlagProvider client={client}>
        <Example />
      </CaptureFlagProvider>,
    );

    expect(container.textContent).toBe("false");

    await act(async () => {
      resolveValue(true);
      await Promise.resolve();
    });

    expect(container.textContent).toBe("true");
    expect(getValue).toHaveBeenCalledWith("newCheckout", false, undefined);
  });

  it("passes provider context to the SDK client", async () => {
    const getValue = vi.fn().mockResolvedValue(true);
    const client = createClient(getValue);
    const context = { identifier: "user-123" };

    function Example() {
      const enabled = useFeatureFlag("newCheckout", false);
      return <span>{String(enabled)}</span>;
    }

    mount(
      <CaptureFlagProvider client={client} context={context}>
        <Example />
      </CaptureFlagProvider>,
    );
    await flushPromises();

    expect(getValue).toHaveBeenCalledWith("newCheckout", false, context);
  });

  it("lets hook context override provider context", async () => {
    const getValue = vi.fn().mockResolvedValue("beta");
    const client = createClient(getValue);
    const providerContext = { identifier: "user-123" };
    const hookContext = { email: "user@example.com" };

    function Example() {
      const variation = useFeatureFlag("checkoutVariant", "control", hookContext);
      return <span>{variation}</span>;
    }

    mount(
      <CaptureFlagProvider client={client} context={providerContext}>
        <Example />
      </CaptureFlagProvider>,
    );
    await flushPromises();

    expect(getValue).toHaveBeenCalledWith("checkoutVariant", "control", hookContext);
  });

  it("updates when the SDK notifies a config change", async () => {
    const context = { identifier: "user-123" };
    const getValue = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const client = createClient(getValue);

    function Example() {
      const enabled = useFeatureFlag("newCheckout", false);
      return <span>{String(enabled)}</span>;
    }

    const container = mount(
      <CaptureFlagProvider client={client} context={context}>
        <Example />
      </CaptureFlagProvider>,
    );
    await flushPromises();
    expect(container.textContent).toBe("false");

    client.emitConfigChange();
    await flushPromises();

    expect(container.textContent).toBe("true");
    expect(getValue).toHaveBeenNthCalledWith(1, "newCheckout", false, context);
    expect(getValue).toHaveBeenNthCalledWith(2, "newCheckout", false, context);
  });

  it("keeps hook context overrides when config changes", async () => {
    const providerContext = { identifier: "user-123" };
    const hookContext = { email: "user@example.com" };
    const getValue = vi.fn().mockResolvedValueOnce("control").mockResolvedValueOnce("beta");
    const client = createClient(getValue);

    function Example() {
      const variation = useFeatureFlag("checkoutVariant", "control", hookContext);
      return <span>{variation}</span>;
    }

    const container = mount(
      <CaptureFlagProvider client={client} context={providerContext}>
        <Example />
      </CaptureFlagProvider>,
    );
    await flushPromises();

    client.emitConfigChange();
    await flushPromises();

    expect(container.textContent).toBe("beta");
    expect(getValue).toHaveBeenLastCalledWith("checkoutVariant", "control", hookContext);
  });

  it("returns fallback during render when the flag key changes", async () => {
    let resolveFirst: (value: string) => void = () => undefined;
    let resolveSecond: (value: string) => void = () => undefined;
    const getValue = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveSecond = resolve;
          }),
      );
    const client = createClient(getValue);
    const renderValues: string[] = [];

    function Example({ flagKey }: { flagKey: string }) {
      const variation = useFeatureFlag(flagKey, "fallback");
      renderValues.push(`${flagKey}:${variation}`);
      return <span>{variation}</span>;
    }

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    mountedRoots.push(root);

    act(() => {
      root.render(
        <CaptureFlagProvider client={client}>
          <Example flagKey="checkoutA" />
        </CaptureFlagProvider>,
      );
    });

    await act(async () => {
      resolveFirst("enabled-a");
      await Promise.resolve();
    });
    expect(container.textContent).toBe("enabled-a");

    act(() => {
      root.render(
        <CaptureFlagProvider client={client}>
          <Example flagKey="checkoutB" />
        </CaptureFlagProvider>,
      );
    });

    expect(renderValues).not.toContain("checkoutB:enabled-a");
    expect(container.textContent).toBe("fallback");

    await act(async () => {
      resolveSecond("enabled-b");
      await Promise.resolve();
    });
    expect(container.textContent).toBe("enabled-b");
  });

  it("throws when the hook is used outside the provider", () => {
    function Example() {
      useFeatureFlag("newCheckout", false);
      return null;
    }

    expect(() => renderToString(<Example />)).toThrow(
      "useFeatureFlag must be used within CaptureFlagProvider",
    );
  });

  it("removes the SDK subscription on unmount", async () => {
    const getValue = vi.fn().mockResolvedValue(true);
    const client = createClient(getValue);

    function Example() {
      const enabled = useFeatureFlag("newCheckout", false);
      return <span>{String(enabled)}</span>;
    }

    const { root } = mountWithRoot(
      <CaptureFlagProvider client={client}>
        <Example />
      </CaptureFlagProvider>,
    );
    expect(client.listenerCount()).toBe(1);

    act(() => {
      root.unmount();
    });
    mountedRoots.splice(mountedRoots.indexOf(root), 1);

    expect(client.listenerCount()).toBe(0);
    client.emitConfigChange();
    await flushPromises();
    expect(getValue).toHaveBeenCalledTimes(1);
  });
});
