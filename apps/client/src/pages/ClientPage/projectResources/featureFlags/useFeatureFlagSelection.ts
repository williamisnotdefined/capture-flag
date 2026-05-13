import { useEffect, useState } from "react";
import type { FeatureFlag } from "../../../../types";

export function useFeatureFlagSelection(flags: FeatureFlag[]) {
  const [selectedFeatureFlagId, setSelectedFeatureFlagId] = useState("");
  const [pendingSelectedFeatureFlagId, setPendingSelectedFeatureFlagId] = useState("");

  useEffect(() => {
    const selectedFlagExists = flags.some((flag) => flag.id === selectedFeatureFlagId);

    if (
      pendingSelectedFeatureFlagId &&
      selectedFeatureFlagId === pendingSelectedFeatureFlagId &&
      !selectedFlagExists
    ) {
      return;
    }

    if (
      pendingSelectedFeatureFlagId &&
      (selectedFlagExists || selectedFeatureFlagId !== pendingSelectedFeatureFlagId)
    ) {
      setPendingSelectedFeatureFlagId("");
    }

    const nextFeatureFlagId = selectedFlagExists ? selectedFeatureFlagId : (flags[0]?.id ?? "");

    if (selectedFeatureFlagId !== nextFeatureFlagId) {
      setSelectedFeatureFlagId(nextFeatureFlagId);
    }
  }, [flags, pendingSelectedFeatureFlagId, selectedFeatureFlagId]);

  function selectCreatedFeatureFlag(featureFlag: FeatureFlag) {
    setPendingSelectedFeatureFlagId(featureFlag.id);
    setSelectedFeatureFlagId(featureFlag.id);
  }

  function clearFeatureFlagSelection() {
    setPendingSelectedFeatureFlagId("");
    setSelectedFeatureFlagId("");
  }

  return {
    clearFeatureFlagSelection,
    selectCreatedFeatureFlag,
    selectFeatureFlagId: setSelectedFeatureFlagId,
    selectedFeatureFlag: flags.find((flag) => flag.id === selectedFeatureFlagId),
    selectedFeatureFlagId,
  };
}
