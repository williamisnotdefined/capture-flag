import { useCollectionSelection } from "@core/hooks/useCollectionSelection";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const items = [
  { id: "item_1", name: "First" },
  { id: "item_2", name: "Second" },
];

describe("useCollectionSelection", () => {
  it("selects the first item by default", async () => {
    const { result } = renderHook(() => useCollectionSelection(items));

    await waitFor(() => expect(result.current.selectedId).toBe("item_1"));
    expect(result.current.selectedItem).toEqual(items[0]);
  });

  it("keeps a pending selection until the item exists", async () => {
    const { rerender, result } = renderHook(
      ({ collection }) => useCollectionSelection(collection),
      { initialProps: { collection: items } },
    );

    await waitFor(() => expect(result.current.selectedId).toBe("item_1"));

    act(() => {
      result.current.selectPendingId("item_3");
    });

    expect(result.current.selectedId).toBe("item_3");
    expect(result.current.selectedItem).toBeUndefined();

    rerender({ collection: [...items, { id: "item_3", name: "Third" }] });

    await waitFor(() =>
      expect(result.current.selectedItem).toEqual({ id: "item_3", name: "Third" }),
    );
  });

  it("selects a pending item object", async () => {
    const { result } = renderHook(() => useCollectionSelection(items));

    await waitFor(() => expect(result.current.selectedId).toBe("item_1"));

    act(() => {
      result.current.selectPendingItem(items[1]);
    });

    expect(result.current.selectedItem).toEqual(items[1]);
  });

  it("clears and restores selection when collections change", async () => {
    const { rerender, result } = renderHook(
      ({ collection }) => useCollectionSelection(collection),
      { initialProps: { collection: items } },
    );

    await waitFor(() => expect(result.current.selectedId).toBe("item_1"));

    rerender({ collection: [] });

    await waitFor(() => expect(result.current.selectedId).toBe(""));

    act(() => {
      result.current.clearSelection();
    });

    rerender({ collection: [{ id: "item_4", name: "Fourth" }] });

    await waitFor(() => expect(result.current.selectedId).toBe("item_4"));
  });
});
