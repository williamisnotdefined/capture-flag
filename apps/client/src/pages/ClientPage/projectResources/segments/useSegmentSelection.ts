import { useEffect, useState } from "react";
import type { Segment } from "../../../../types";

export function useSegmentSelection(segments: Segment[]) {
  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const [pendingSelectedSegmentId, setPendingSelectedSegmentId] = useState("");

  useEffect(() => {
    const selectedSegmentExists = segments.some((segment) => segment.id === selectedSegmentId);

    if (
      pendingSelectedSegmentId &&
      selectedSegmentId === pendingSelectedSegmentId &&
      !selectedSegmentExists
    ) {
      return;
    }

    if (
      pendingSelectedSegmentId &&
      (selectedSegmentExists || selectedSegmentId !== pendingSelectedSegmentId)
    ) {
      setPendingSelectedSegmentId("");
    }

    const nextSegmentId = selectedSegmentExists ? selectedSegmentId : (segments[0]?.id ?? "");
    if (selectedSegmentId !== nextSegmentId) {
      setSelectedSegmentId(nextSegmentId);
    }
  }, [pendingSelectedSegmentId, segments, selectedSegmentId]);

  function selectCreatedSegment(segment: Segment) {
    setPendingSelectedSegmentId(segment.id);
    setSelectedSegmentId(segment.id);
  }

  function clearSegmentSelection() {
    setPendingSelectedSegmentId("");
    setSelectedSegmentId("");
  }

  return {
    clearSegmentSelection,
    selectCreatedSegment,
    selectSegmentId: setSelectedSegmentId,
    selectedSegment: segments.find((segment) => segment.id === selectedSegmentId),
  };
}
