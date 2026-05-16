import { useEffect, useState } from "react";

export function useCollectionSelection<TItem extends { id: string }>(items: TItem[]) {
  const [selectedId, setSelectedId] = useState("");
  const [pendingSelectedId, setPendingSelectedId] = useState("");

  useEffect(() => {
    const selectedItemExists = items.some((item) => item.id === selectedId);

    if (pendingSelectedId && selectedId === pendingSelectedId && !selectedItemExists) {
      return;
    }

    if (pendingSelectedId && (selectedItemExists || selectedId !== pendingSelectedId)) {
      setPendingSelectedId("");
    }

    const nextSelectedId = selectedItemExists ? selectedId : (items[0]?.id ?? "");
    if (selectedId !== nextSelectedId) {
      setSelectedId(nextSelectedId);
    }
  }, [items, pendingSelectedId, selectedId]);

  function selectPendingId(itemId: string) {
    setPendingSelectedId(itemId);
    setSelectedId(itemId);
  }

  function selectPendingItem(item: TItem) {
    selectPendingId(item.id);
  }

  function clearSelection() {
    setPendingSelectedId("");
    setSelectedId("");
  }

  return {
    clearSelection,
    selectId: setSelectedId,
    selectPendingId,
    selectPendingItem,
    selectedId,
    selectedItem: items.find((item) => item.id === selectedId),
  };
}
