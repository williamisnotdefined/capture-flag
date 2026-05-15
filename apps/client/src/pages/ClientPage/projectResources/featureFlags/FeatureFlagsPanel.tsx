import { useDeferredValue, useState } from "react";
import {
  useCreateFeatureFlag,
  useDeleteFeatureFlag,
  useGetConfigFeatureFlags,
  useGetFeatureFlagActivity,
  useUpdateFeatureFlag,
  useUpdateFeatureFlagEnvironmentValue,
} from "../../../../api/featureFlags";
import { useGetConfigSegments } from "../../../../api/segments";
import {
  Button,
  ErrorMessage,
  Eyebrow,
  Panel,
  PermissionHint,
  SelectInput,
  TextInput,
} from "../../../../components";
import type { Environment, FeatureFlag } from "../../../../types";
import { AuditTimeline } from "../../audit/AuditTimeline";
import { CreateFeatureFlagForm } from "./CreateFeatureFlagForm";
import { FeatureFlagList } from "./FeatureFlagList";
import { FeatureFlagMetadataForm } from "./FeatureFlagMetadataForm";
import { FeatureFlagValueForm } from "./FeatureFlagValueForm";
import {
  type CreateFeatureFlagFormValues,
  type UpdateFeatureFlagFormValues,
  featureFlagTypes,
} from "./schemas";
import { useFeatureFlagSelection } from "./useFeatureFlagSelection";
import {
  type FeatureFlagOperationalState,
  featureFlagStateLabels,
  getFeatureFlagEnvironmentValue,
  getFeatureFlagOperationalState,
  parseTagsInput,
} from "./utils";

type FeatureFlagsPanelProps = {
  canManageFeatureFlags: boolean;
  configId: string;
  environmentId: string;
  environmentName?: string;
  environments: Environment[];
  onSelectEnvironment: (environmentId: string) => void;
};

export function FeatureFlagsPanel({
  canManageFeatureFlags,
  configId,
  environmentId,
  environmentName,
  environments,
  onSelectEnvironment,
}: FeatureFlagsPanelProps) {
  const [searchInput, setSearchInput] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | FeatureFlagOperationalState>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const deferredSearchInput = useDeferredValue(searchInput.trim().toLowerCase());
  const flagsQuery = useGetConfigFeatureFlags(configId);
  const segmentsQuery = useGetConfigSegments(configId);
  const flags = flagsQuery.data ?? [];
  const segments = segmentsQuery.data ?? [];
  const availableTags = Array.from(new Set(flags.flatMap((flag) => flag.tags))).sort(
    (left, right) => left.localeCompare(right),
  );
  const visibleFlags = flags.filter((flag) => {
    const haystack = [flag.name, flag.key, flag.description ?? "", flag.tags.join(" ")]
      .join(" ")
      .toLowerCase();
    const state = environmentId ? getFeatureFlagOperationalState(flag, environmentId) : "missing";

    return (
      (!deferredSearchInput || haystack.includes(deferredSearchInput)) &&
      (typeFilter === "all" || flag.type === typeFilter) &&
      (tagFilter === "all" || flag.tags.includes(tagFilter)) &&
      (stateFilter === "all" || state === stateFilter)
    );
  });
  const {
    clearFeatureFlagSelection,
    selectCreatedFeatureFlag,
    selectFeatureFlagId,
    selectedFeatureFlag: selectedFlag,
    selectedFeatureFlagId,
  } = useFeatureFlagSelection(flags);
  const selectedEnvironmentValue = selectedFlag?.environmentValues.find(
    (value) => value.environmentId === environmentId,
  );
  const activityQuery = useGetFeatureFlagActivity({
    configId,
    featureFlagId: selectedFlag?.id ?? "",
  });
  const activityEntries = activityQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const createFeatureFlagMutation = useCreateFeatureFlag({
    configId,
    onSuccess: selectCreatedFeatureFlag,
  });
  const deleteFeatureFlagMutation = useDeleteFeatureFlag({
    configId,
    onSuccess: clearFeatureFlagSelection,
  });
  const updateFeatureFlagMutation = useUpdateFeatureFlag({
    configId,
    onSuccess: (featureFlag) => {
      selectFeatureFlagId(featureFlag.id);
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
      <ErrorMessage error={segmentsQuery.error} />
      <ErrorMessage error={createFeatureFlagMutation.error} />
      <ErrorMessage error={deleteFeatureFlagMutation.error} />
      <ErrorMessage error={updateFeatureFlagMutation.error} />

      <FeatureFlagFilters
        availableTags={availableTags}
        searchInput={searchInput}
        stateFilter={stateFilter}
        tagFilter={tagFilter}
        typeFilter={typeFilter}
        onSearchInputChange={setSearchInput}
        onStateFilterChange={setStateFilter}
        onTagFilterChange={setTagFilter}
        onTypeFilterChange={setTypeFilter}
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <FeatureFlagList
          canManageFeatureFlags={canManageFeatureFlags}
          environmentId={environmentId}
          flags={visibleFlags}
          isDeleting={deleteFeatureFlagMutation.isPending}
          isFetching={flagsQuery.isFetching}
          onDelete={(featureFlagId) => deleteFeatureFlagMutation.mutate(featureFlagId)}
          onSelect={selectFeatureFlagId}
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
              <FeatureFlagEnvironmentSummary
                environments={environments}
                flag={selectedFlag}
                onSelectEnvironment={onSelectEnvironment}
                selectedEnvironmentId={environmentId}
              />
              <FeatureFlagValueForm
                canEditValue={canEditValue}
                environmentId={environmentId}
                environmentName={environmentName}
                flag={selectedFlag}
                flags={flags}
                isPending={updateValueMutation.isPending}
                key={`${selectedFlag.id}:${environmentId}`}
                mutationError={updateValueMutation.error}
                onSubmit={handleUpdateValue}
                segments={segments}
                value={selectedEnvironmentValue}
              />
              <AuditTimeline
                className="border-t border-stone-300 pt-4"
                description="Historico recente da flag e dos seus valores."
                emptyMessage="Sem atividade recente para esta flag."
                entries={activityEntries}
                error={activityQuery.error}
                isFetching={activityQuery.isFetching}
                title="Activity timeline"
              />
              {activityQuery.hasNextPage ? (
                <Button
                  disabled={activityQuery.isFetchingNextPage}
                  onClick={() => void activityQuery.fetchNextPage()}
                  type="button"
                  variant="secondary"
                >
                  {activityQuery.isFetchingNextPage ? "Carregando mais..." : "Carregar mais"}
                </Button>
              ) : null}
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

type FeatureFlagFiltersProps = {
  availableTags: string[];
  searchInput: string;
  stateFilter: "all" | FeatureFlagOperationalState;
  tagFilter: string;
  typeFilter: string;
  onSearchInputChange: (value: string) => void;
  onStateFilterChange: (value: "all" | FeatureFlagOperationalState) => void;
  onTagFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
};

function FeatureFlagFilters({
  availableTags,
  searchInput,
  stateFilter,
  tagFilter,
  typeFilter,
  onSearchInputChange,
  onStateFilterChange,
  onTagFilterChange,
  onTypeFilterChange,
}: FeatureFlagFiltersProps) {
  return (
    <div className="mt-5 grid gap-3 rounded-2xl bg-[#f4f0e8] p-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <TextInput
        aria-label="Buscar flags"
        onChange={(event) => onSearchInputChange(event.target.value)}
        placeholder="Buscar por nome, key, descricao ou tag"
        value={searchInput}
      />
      <SelectInput
        aria-label="Filtrar por tipo"
        onChange={(event) => onTypeFilterChange(event.target.value)}
        value={typeFilter}
      >
        <option value="all">Todos os tipos</option>
        {featureFlagTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </SelectInput>
      <SelectInput
        aria-label="Filtrar por tag"
        onChange={(event) => onTagFilterChange(event.target.value)}
        value={tagFilter}
      >
        <option value="all">Todas as tags</option>
        {availableTags.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </SelectInput>
      <SelectInput
        aria-label="Filtrar por estado"
        onChange={(event) =>
          onStateFilterChange(event.target.value as "all" | FeatureFlagOperationalState)
        }
        value={stateFilter}
      >
        <option value="all">Todos os estados</option>
        {Object.entries(featureFlagStateLabels).map(([state, label]) => (
          <option key={state} value={state}>
            {label}
          </option>
        ))}
      </SelectInput>
    </div>
  );
}

type FeatureFlagEnvironmentSummaryProps = {
  environments: Environment[];
  flag: FeatureFlag;
  selectedEnvironmentId: string;
  onSelectEnvironment: (environmentId: string) => void;
};

function FeatureFlagEnvironmentSummary({
  environments,
  flag,
  selectedEnvironmentId,
  onSelectEnvironment,
}: FeatureFlagEnvironmentSummaryProps) {
  return (
    <section className="grid gap-3 border-b border-stone-300 pb-4">
      <div>
        <Eyebrow>Ambientes</Eyebrow>
        <p className="text-sm text-stone-600">Valores publicados por ambiente para esta flag.</p>
      </div>
      <div className="grid gap-2">
        {environments.map((environment) => {
          const value = getFeatureFlagEnvironmentValue(flag, environment.id);
          const state = getFeatureFlagOperationalState(flag, environment.id);
          const rulesCount = Array.isArray(value?.rulesJson) ? value.rulesJson.length : 0;
          const rolloutCount = Array.isArray(value?.percentageOptionsJson)
            ? value.percentageOptionsJson.length
            : 0;
          const displayedDefaultValue =
            value?.defaultValue ?? flag.initialDefaultValue ?? undefined;

          return (
            <div
              className="grid gap-2 rounded-xl bg-white/70 p-3 text-sm lg:grid-cols-[1fr_1fr_auto] lg:items-center"
              key={environment.id}
            >
              <div>
                <strong className="block text-slate-900">{environment.name}</strong>
                <span className="font-mono text-xs text-stone-600">{environment.key}</span>
              </div>
              <div className="text-stone-700">
                <span className="block">{featureFlagStateLabels[state]}</span>
                <span className="block font-mono text-xs">
                  default: {formatInlineValue(displayedDefaultValue)}
                </span>
                <span className="block text-xs">
                  {rulesCount} rules / {rolloutCount} rollout options
                </span>
              </div>
              <Button
                disabled={selectedEnvironmentId === environment.id}
                onClick={() => onSelectEnvironment(environment.id)}
                type="button"
                variant="secondary"
              >
                {selectedEnvironmentId === environment.id ? "Editando" : "Editar"}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatInlineValue(value: unknown) {
  if (value === undefined) {
    return "-";
  }

  return typeof value === "string" ? value : JSON.stringify(value);
}
