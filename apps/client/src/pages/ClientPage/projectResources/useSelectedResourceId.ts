import { useEffect, useState } from "react";

export function useSelectedResourceId<TResource extends { id: string }>(resources: TResource[]) {
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const nextId = resources.some((resource) => resource.id === selectedId)
      ? selectedId
      : (resources[0]?.id ?? "");

    if (selectedId !== nextId) {
      setSelectedId(nextId);
    }
  }, [resources, selectedId]);

  return [selectedId, setSelectedId] as const;
}
