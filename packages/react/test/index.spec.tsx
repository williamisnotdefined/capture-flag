import type { CaptureFlagClient } from "@capture-flag/sdk-js";
import { type ReactNode, act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaptureFlagProvider, useFeatureFlag } from "../src";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const mountedRoots: Root[] = [];

function createClient(getValue: ReturnType<typeof vi.fn>): CaptureFlagClient {
  return { getValue } as unknown as CaptureFlagClient;
}

function mount(element: ReactNode): HTMLElement {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mountedRoots.push(root);

  act(() => {
    root.render(element);
  });

  return container;
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

  it("throws when the hook is used outside the provider", () => {
    function Example() {
      useFeatureFlag("newCheckout", false);
      return null;
    }

    expect(() => renderToString(<Example />)).toThrow(
      "useFeatureFlag must be used within CaptureFlagProvider",
    );
  });
});
