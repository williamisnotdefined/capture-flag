import { useEffect, useState } from "react";
import {
  useCreateFeatureFlag,
  useDeleteFeatureFlag,
  useGetConfigFeatureFlags,
  useUpdateFeatureFlag,
  useUpdateFeatureFlagEnvironmentValue,
} from "../../../../api/featureFlags";
import { Panel } from "../../../../components/Panel";
import { ErrorMessage, PermissionHint } from "../../../../components/ui";
import { CreateFeatureFlagForm } from "./CreateFeatureFlagForm";
import { FeatureFlagList } from "./FeatureFlagList";
import { FeatureFlagMetadataForm } from "./FeatureFlagMetadataForm";
import { FeatureFlagValueForm } from "./FeatureFlagValueForm";
import type { CreateFeatureFlagFormValues, UpdateFeatureFlagFormValues } from "./schemas";
import { parseTagsInput } from "./utils";

type FeatureFlagsPanelProps = {
  canManageFeatureFlags: boolean;
  configId: string;
  environmentId: string;
  environmentName?: string;
};

export function FeatureFlagsPanel({
  canManageFeatureFlags,
  configId,
  environmentId,
  environmentName,
}: FeatureFlagsPanelProps) {
  const [selectedFeatureFlagId, setSelectedFeatureFlagId] = useState("");
  const [pendingSelectedFeatureFlagId, setPendingSelectedFeatureFlagId] = useState("");
  const flagsQuery = useGetConfigFeatureFlags(configId);
  const flags = flagsQuery.data ?? [];
  const selectedFlag = flags.find((flag) => flag.id === selectedFeatureFlagId);
  const selectedEnvironmentValue = selectedFlag?.environmentValues.find(
    (value) => value.environmentId === environmentId,
  );

  useEffect(() => {
    const selectedFlagExists = flags.some((flag) => flag.id === selectedFeatureFlagId);
    if (
      pendingSelectedFeatureFlagId &&
      selectedFeatureFlagId === pendingSelectedFeatureFlagId &&
      !selectedFlagExists
    ) {
      return;
    }

    if (pendingSelectedFeatureFlagId && selectedFlagExists) {
      setPendingSelectedFeatureFlagId("");
    }

    const nextFeatureFlagId = selectedFlagExists ? selectedFeatureFlagId : (flags[0]?.id ?? "");

    if (selectedFeatureFlagId !== nextFeatureFlagId) {
      setSelectedFeatureFlagId(nextFeatureFlagId);
    }
  }, [flags, pendingSelectedFeatureFlagId, selectedFeatureFlagId]);

  const createFeatureFlagMutation = useCreateFeatureFlag({
    configId,
    onSuccess: (featureFlag) => {
      setPendingSelectedFeatureFlagId(featureFlag.id);
      setSelectedFeatureFlagId(featureFlag.id);
    },
  });
  const deleteFeatureFlagMutation = useDeleteFeatureFlag({
    configId,
    onSuccess: () => {
      setSelectedFeatureFlagId("");
    },
  });
  const updateFeatureFlagMutation = useUpdateFeatureFlag({
    configId,
    onSuccess: (featureFlag) => {
      setSelectedFeatureFlagId(featureFlag.id);
    },
  });
  const updateValueMutation = useUpdateFeatureFlagEnvironmentValue({ configId });

  const canCreateFlag = Boolean(configId && canManageFeatureFlags);
  const canEditMetadata = Boolean(selectedFlag && canManageFeatureFlags);
  const canEditValue = Boolean(selectedFlag && environmentId && canManageFeatureFlags);

  async function handleCreateFeatureFlag(values: CreateFeatureFlagFormValues) {
    const hint = values.hint.trim();
    const ownerUserId = values.ownerUserId.trim();
    const tags = parseTagsInput(values.tags);

    await createFeatureFlagMutation.mutateAsync({
      key: values.key.trim(),
      name: values.name.trim(),
      type: values.type,
      ...(values.description.trim() ? { description: values.description.trim() } : {}),
      ...(hint ? { hint } : {}),
      ...(ownerUserId ? { ownerUserId } : {}),
      ...(tags.length > 0 ? { tags } : {}),
    });
  }

  async function handleUpdateFeatureFlag(values: UpdateFeatureFlagFormValues) {
    if (!selectedFlag) {
      return;
    }

    await updateFeatureFlagMutation.mutateAsync({
      featureFlagId: selectedFlag.id,
      key: values.key.trim(),
      name: values.name.trim(),
      description: values.description.trim(),
      hint: values.hint.trim(),
      ownerUserId: values.ownerUserId.trim() || null,
      tags: parseTagsInput(values.tags),
    });
  }

  async function handleUpdateValue(values: {
    defaultValue: unknown;
    percentageAttribute: string;
    percentageOptionsJson: unknown[];
    rulesJson: unknown[];
  }) {
    if (!selectedFlag || !environmentId) {
      return;
    }

    await updateValueMutation.mutateAsync({
      featureFlagId: selectedFlag.id,
      environmentId,
      ...values,
    });
  }

  return (
    <Panel title="Flags" wide>
      <CreateFeatureFlagForm
        canCreateFlag={canCreateFlag}
        isPending={createFeatureFlagMutation.isPending}
        onSubmit={handleCreateFeatureFlag}
      />

      {!canManageFeatureFlags ? (
        <PermissionHint>
          Voce precisa ser developer, project_admin, owner ou admin para gerenciar flags.
        </PermissionHint>
      ) : null}
      <ErrorMessage error={flagsQuery.error} />
      <ErrorMessage error={createFeatureFlagMutation.error} />
      <ErrorMessage error={deleteFeatureFlagMutation.error} />
      <ErrorMessage error={updateFeatureFlagMutation.error} />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <FeatureFlagList
          canManageFeatureFlags={canManageFeatureFlags}
          flags={flags}
          isDeleting={deleteFeatureFlagMutation.isPending}
          isFetching={flagsQuery.isFetching}
          onDelete={(featureFlagId) => deleteFeatureFlagMutation.mutate(featureFlagId)}
          onSelect={setSelectedFeatureFlagId}
          selectedFeatureFlagId={selectedFeatureFlagId}
        />

        <div className="rounded-2xl bg-[#f4f0e8] p-4">
          {selectedFlag ? (
            <div className="grid gap-4">
              <FeatureFlagMetadataForm
                canEditMetadata={canEditMetadata}
                flag={selectedFlag}
                isPending={updateFeatureFlagMutation.isPending}
                onSubmit={handleUpdateFeatureFlag}
              />
              <FeatureFlagValueForm
                canEditValue={canEditValue}
                environmentId={environmentId}
                environmentName={environmentName}
                flag={selectedFlag}
                isPending={updateValueMutation.isPending}
                mutationError={updateValueMutation.error}
                onSubmit={handleUpdateValue}
                value={selectedEnvironmentValue}
              />
            </div>
          ) : (
            <p className="text-sm text-stone-600">
              Selecione ou crie uma flag para editar valores.
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}
