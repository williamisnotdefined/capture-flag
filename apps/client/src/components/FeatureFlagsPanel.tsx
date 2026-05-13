import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateFeatureFlag,
  useDeleteFeatureFlag,
  useGetConfigFeatureFlags,
  useUpdateFeatureFlag,
  useUpdateFeatureFlagEnvironmentValue,
} from "../api/featureFlags";
import type { FeatureFlag, FeatureFlagType } from "../types";
import { Panel } from "./Panel";

const fieldClassName =
  "rounded-xl border border-[#cec6b8] bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-55";
const primaryButtonClassName =
  "rounded-xl bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55";
const secondaryButtonClassName =
  "rounded-xl border border-slate-300 bg-white/80 px-4 py-3 font-bold text-slate-900 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-55";
const dangerButtonClassName =
  "rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-bold text-red-800 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-55";

const featureFlagTypes = ["boolean", "string", "integer", "double"] as const;
const uuidSchema = z.string().uuid();
const optionalUuidSchema = z
  .string()
  .trim()
  .refine((value) => !value || uuidSchema.safeParse(value).success, "Informe um UUID valido.");
const createFeatureFlagSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Informe uma key.")
    .max(80, "Use ate 80 caracteres.")
    .regex(
      /^[A-Za-z][A-Za-z0-9_.-]*$/,
      "Use letras, numeros, ponto, underline ou hifen. Comece com letra.",
    ),
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Use ate 120 caracteres."),
  type: z.enum(featureFlagTypes),
  description: z.string().max(500, "Use ate 500 caracteres."),
  hint: z.string().max(500, "Use ate 500 caracteres."),
  ownerUserId: optionalUuidSchema,
  tags: z.string().max(1000, "Use ate 1000 caracteres."),
});
const updateFeatureFlagSchema = createFeatureFlagSchema.omit({ type: true });
const valueFormSchema = z.object({
  defaultValue: z.string(),
  percentageAttribute: z
    .string()
    .trim()
    .min(1, "Informe um atributo.")
    .max(80, "Use ate 80 caracteres."),
  percentageOptionsJson: z.string(),
  rulesJson: z.string(),
});

type CreateFeatureFlagFormValues = z.infer<typeof createFeatureFlagSchema>;
type UpdateFeatureFlagFormValues = z.infer<typeof updateFeatureFlagSchema>;
type ValueFormValues = z.infer<typeof valueFormSchema>;

type FeatureFlagsPanelProps = {
  canManageFeatureFlags: boolean;
  configId: string;
  environmentId: string;
  environmentName?: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro inesperado";
}

function ErrorMessage({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }

  return <p className="mt-3 text-sm font-semibold text-red-700">{getErrorMessage(error)}</p>;
}

function defaultValueForType(type: FeatureFlagType) {
  if (type === "boolean") {
    return "false";
  }

  if (type === "string") {
    return "";
  }

  return "0";
}

function valueToInput(flag: FeatureFlag | undefined, value: unknown) {
  if (!flag) {
    return "";
  }

  if (value === undefined) {
    return defaultValueForType(flag.type);
  }

  if (flag.type === "boolean") {
    return value === true ? "true" : "false";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return defaultValueForType(flag.type);
}

function parseDefaultValue(type: FeatureFlagType, value: string) {
  if (type === "boolean") {
    return value === "true";
  }

  if (type === "string") {
    return value;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new Error("Informe um numero valido.");
  }

  const numberValue = Number(normalizedValue);
  if (!Number.isFinite(numberValue)) {
    throw new Error("Informe um numero valido.");
  }

  if (type === "integer" && !Number.isInteger(numberValue)) {
    throw new Error("Informe um numero inteiro.");
  }

  return numberValue;
}

function jsonArrayToInput(value: unknown) {
  return JSON.stringify(Array.isArray(value) ? value : [], null, 2);
}

function parseJsonArray(value: string, fieldLabel: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(normalizedValue);
    if (Array.isArray(parsedValue)) {
      return parsedValue;
    }
  } catch {
    throw new Error(`${fieldLabel} deve ser um JSON valido.`);
  }

  throw new Error(`${fieldLabel} deve ser um array JSON.`);
}

function parseTagsInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

export function FeatureFlagsPanel({
  canManageFeatureFlags,
  configId,
  environmentId,
  environmentName,
}: FeatureFlagsPanelProps) {
  const [selectedFeatureFlagId, setSelectedFeatureFlagId] = useState("");
  const [pendingSelectedFeatureFlagId, setPendingSelectedFeatureFlagId] = useState("");
  const [valueFormError, setValueFormError] = useState("");
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

  const {
    formState: { errors: createErrors, isSubmitting: isCreateSubmitting },
    handleSubmit: handleCreateSubmit,
    register: registerCreate,
    reset: resetCreate,
  } = useForm<CreateFeatureFlagFormValues>({
    defaultValues: {
      key: "",
      name: "",
      type: "boolean",
      description: "",
      hint: "",
      ownerUserId: "",
      tags: "",
    },
    resolver: zodResolver(createFeatureFlagSchema),
  });

  const {
    formState: { errors: updateErrors, isSubmitting: isUpdateSubmitting },
    handleSubmit: handleUpdateSubmit,
    register: registerUpdate,
    reset: resetUpdate,
  } = useForm<UpdateFeatureFlagFormValues>({
    defaultValues: {
      key: "",
      name: "",
      description: "",
      hint: "",
      ownerUserId: "",
      tags: "",
    },
    resolver: zodResolver(updateFeatureFlagSchema),
  });

  const {
    formState: { errors: valueErrors, isSubmitting: isValueSubmitting },
    handleSubmit: handleValueSubmit,
    register: registerValue,
    reset: resetValue,
  } = useForm<ValueFormValues>({
    defaultValues: {
      defaultValue: "",
      percentageAttribute: "identifier",
      percentageOptionsJson: "[]",
      rulesJson: "[]",
    },
    resolver: zodResolver(valueFormSchema),
  });

  useEffect(() => {
    resetUpdate({
      key: selectedFlag?.key ?? "",
      name: selectedFlag?.name ?? "",
      description: selectedFlag?.description ?? "",
      hint: selectedFlag?.hint ?? "",
      ownerUserId: selectedFlag?.ownerUserId ?? "",
      tags: selectedFlag?.tags.join(", ") ?? "",
    });
  }, [resetUpdate, selectedFlag]);

  useEffect(() => {
    resetValue({
      defaultValue: valueToInput(selectedFlag, selectedEnvironmentValue?.defaultValue),
      percentageAttribute: selectedEnvironmentValue?.percentageAttribute ?? "identifier",
      percentageOptionsJson: jsonArrayToInput(selectedEnvironmentValue?.percentageOptionsJson),
      rulesJson: jsonArrayToInput(selectedEnvironmentValue?.rulesJson),
    });
    setValueFormError("");
  }, [resetValue, selectedEnvironmentValue, selectedFlag]);

  const canCreateFlag = Boolean(configId && canManageFeatureFlags);
  const canEditMetadata = Boolean(selectedFlag && canManageFeatureFlags);
  const canEditValue = Boolean(selectedFlag && environmentId && canManageFeatureFlags);

  async function handleCreateFeatureFlag(values: CreateFeatureFlagFormValues) {
    const hint = values.hint.trim();
    const ownerUserId = values.ownerUserId.trim();
    const tags = parseTagsInput(values.tags);

    try {
      await createFeatureFlagMutation.mutateAsync({
        key: values.key.trim(),
        name: values.name.trim(),
        type: values.type,
        ...(values.description.trim() ? { description: values.description.trim() } : {}),
        ...(hint ? { hint } : {}),
        ...(ownerUserId ? { ownerUserId } : {}),
        ...(tags.length > 0 ? { tags } : {}),
      });
      resetCreate();
    } catch {
      // Mutation hooks expose the error state in the panel.
    }
  }

  async function handleUpdateFeatureFlag(values: UpdateFeatureFlagFormValues) {
    if (!selectedFlag) {
      return;
    }

    try {
      await updateFeatureFlagMutation.mutateAsync({
        featureFlagId: selectedFlag.id,
        key: values.key.trim(),
        name: values.name.trim(),
        description: values.description.trim(),
        hint: values.hint.trim(),
        ownerUserId: values.ownerUserId.trim() || null,
        tags: parseTagsInput(values.tags),
      });
    } catch {
      // Mutation hooks expose the error state in the panel.
    }
  }

  async function handleUpdateValue(values: ValueFormValues) {
    if (!selectedFlag || !environmentId) {
      return;
    }

    try {
      setValueFormError("");
      await updateValueMutation.mutateAsync({
        featureFlagId: selectedFlag.id,
        environmentId,
        defaultValue: parseDefaultValue(selectedFlag.type, values.defaultValue),
        percentageAttribute: values.percentageAttribute.trim(),
        percentageOptionsJson: parseJsonArray(values.percentageOptionsJson, "Rollout percentual"),
        rulesJson: parseJsonArray(values.rulesJson, "Rules"),
      });
    } catch (error) {
      if (error instanceof Error && !updateValueMutation.error) {
        setValueFormError(error.message);
      }
    }
  }

  return (
    <Panel title="Flags" wide>
      <form
        className="grid gap-3 lg:grid-cols-4"
        noValidate
        onSubmit={handleCreateSubmit(handleCreateFeatureFlag)}
      >
        <div className="grid gap-2">
          <input
            aria-invalid={createErrors.key ? true : undefined}
            className={fieldClassName}
            disabled={!canCreateFlag || createFeatureFlagMutation.isPending || isCreateSubmitting}
            placeholder="newCheckout"
            {...registerCreate("key")}
          />
          {createErrors.key?.message ? (
            <p className="text-sm font-semibold text-red-700">{createErrors.key.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <input
            aria-invalid={createErrors.name ? true : undefined}
            className={fieldClassName}
            disabled={!canCreateFlag || createFeatureFlagMutation.isPending || isCreateSubmitting}
            placeholder="Nome da flag"
            {...registerCreate("name")}
          />
          {createErrors.name?.message ? (
            <p className="text-sm font-semibold text-red-700">{createErrors.name.message}</p>
          ) : null}
        </div>
        <select
          aria-invalid={createErrors.type ? true : undefined}
          className={fieldClassName}
          disabled={!canCreateFlag || createFeatureFlagMutation.isPending || isCreateSubmitting}
          {...registerCreate("type")}
        >
          {featureFlagTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <div className="grid gap-2">
          <input
            aria-invalid={createErrors.description ? true : undefined}
            className={fieldClassName}
            disabled={!canCreateFlag || createFeatureFlagMutation.isPending || isCreateSubmitting}
            placeholder="Descricao opcional"
            {...registerCreate("description")}
          />
          {createErrors.description?.message ? (
            <p className="text-sm font-semibold text-red-700">{createErrors.description.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <input
            aria-invalid={createErrors.tags ? true : undefined}
            className={fieldClassName}
            disabled={!canCreateFlag || createFeatureFlagMutation.isPending || isCreateSubmitting}
            placeholder="tags separadas por virgula"
            {...registerCreate("tags")}
          />
          {createErrors.tags?.message ? (
            <p className="text-sm font-semibold text-red-700">{createErrors.tags.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <input
            aria-invalid={createErrors.hint ? true : undefined}
            className={fieldClassName}
            disabled={!canCreateFlag || createFeatureFlagMutation.isPending || isCreateSubmitting}
            placeholder="Hint opcional"
            {...registerCreate("hint")}
          />
          {createErrors.hint?.message ? (
            <p className="text-sm font-semibold text-red-700">{createErrors.hint.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <input
            aria-invalid={createErrors.ownerUserId ? true : undefined}
            className={fieldClassName}
            disabled={!canCreateFlag || createFeatureFlagMutation.isPending || isCreateSubmitting}
            placeholder="Owner user id opcional"
            {...registerCreate("ownerUserId")}
          />
          {createErrors.ownerUserId?.message ? (
            <p className="text-sm font-semibold text-red-700">{createErrors.ownerUserId.message}</p>
          ) : null}
        </div>
        <button
          className={`${primaryButtonClassName} self-start`}
          disabled={!canCreateFlag || createFeatureFlagMutation.isPending || isCreateSubmitting}
          type="submit"
        >
          {createFeatureFlagMutation.isPending ? "Criando..." : "Criar flag"}
        </button>
      </form>

      {!canManageFeatureFlags ? (
        <p className="mt-3 text-sm text-stone-600">
          Voce precisa ser developer, project_admin, owner ou admin para gerenciar flags.
        </p>
      ) : null}
      <ErrorMessage error={flagsQuery.error} />
      <ErrorMessage error={createFeatureFlagMutation.error} />
      <ErrorMessage error={deleteFeatureFlagMutation.error} />
      <ErrorMessage error={updateFeatureFlagMutation.error} />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-3 self-start">
          {flags.map((flag) => (
            <div
              className={`grid gap-3 rounded-2xl p-4 text-sm lg:grid-cols-[1fr_auto] ${
                flag.id === selectedFeatureFlagId
                  ? "bg-slate-900 text-white"
                  : "bg-[#f4f0e8] text-slate-800"
              }`}
              key={flag.id}
            >
              <button
                className="text-left"
                onClick={() => setSelectedFeatureFlagId(flag.id)}
                type="button"
              >
                <strong className="block">{flag.name}</strong>
                <span className="block break-all font-mono text-xs">{flag.key}</span>
                <span className="block text-xs opacity-80">{flag.type}</span>
              </button>
              <button
                className={dangerButtonClassName}
                disabled={!canManageFeatureFlags || deleteFeatureFlagMutation.isPending}
                onClick={() => deleteFeatureFlagMutation.mutate(flag.id)}
                type="button"
              >
                Apagar
              </button>
            </div>
          ))}
          {flags.length === 0 && !flagsQuery.isFetching ? (
            <p className="text-sm text-stone-600">Sem flags nesta config.</p>
          ) : null}
          {flagsQuery.isFetching ? (
            <p className="text-sm text-stone-600">Atualizando flags...</p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-[#f4f0e8] p-4">
          {selectedFlag ? (
            <div className="grid gap-4">
              <form
                className="grid gap-3 border-b border-stone-300 pb-4"
                noValidate
                onSubmit={handleUpdateSubmit(handleUpdateFeatureFlag)}
              >
                <div>
                  <span className="block text-sm font-black uppercase tracking-[0.08em] text-stone-600">
                    Metadata
                  </span>
                  <strong className="text-slate-900">{selectedFlag.key}</strong>
                </div>

                <div className="grid gap-2">
                  <input
                    aria-invalid={updateErrors.key ? true : undefined}
                    className={fieldClassName}
                    disabled={
                      !canEditMetadata || updateFeatureFlagMutation.isPending || isUpdateSubmitting
                    }
                    placeholder="key"
                    {...registerUpdate("key")}
                  />
                  {updateErrors.key?.message ? (
                    <p className="text-sm font-semibold text-red-700">{updateErrors.key.message}</p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <input
                    aria-invalid={updateErrors.name ? true : undefined}
                    className={fieldClassName}
                    disabled={
                      !canEditMetadata || updateFeatureFlagMutation.isPending || isUpdateSubmitting
                    }
                    placeholder="Nome da flag"
                    {...registerUpdate("name")}
                  />
                  {updateErrors.name?.message ? (
                    <p className="text-sm font-semibold text-red-700">
                      {updateErrors.name.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <input
                    aria-invalid={updateErrors.description ? true : undefined}
                    className={fieldClassName}
                    disabled={
                      !canEditMetadata || updateFeatureFlagMutation.isPending || isUpdateSubmitting
                    }
                    placeholder="Descricao opcional"
                    {...registerUpdate("description")}
                  />
                  {updateErrors.description?.message ? (
                    <p className="text-sm font-semibold text-red-700">
                      {updateErrors.description.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <input
                    aria-invalid={updateErrors.tags ? true : undefined}
                    className={fieldClassName}
                    disabled={
                      !canEditMetadata || updateFeatureFlagMutation.isPending || isUpdateSubmitting
                    }
                    placeholder="tags separadas por virgula"
                    {...registerUpdate("tags")}
                  />
                  {updateErrors.tags?.message ? (
                    <p className="text-sm font-semibold text-red-700">
                      {updateErrors.tags.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <input
                    aria-invalid={updateErrors.hint ? true : undefined}
                    className={fieldClassName}
                    disabled={
                      !canEditMetadata || updateFeatureFlagMutation.isPending || isUpdateSubmitting
                    }
                    placeholder="Hint opcional"
                    {...registerUpdate("hint")}
                  />
                  {updateErrors.hint?.message ? (
                    <p className="text-sm font-semibold text-red-700">
                      {updateErrors.hint.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <input
                    aria-invalid={updateErrors.ownerUserId ? true : undefined}
                    className={fieldClassName}
                    disabled={
                      !canEditMetadata || updateFeatureFlagMutation.isPending || isUpdateSubmitting
                    }
                    placeholder="Owner user id opcional"
                    {...registerUpdate("ownerUserId")}
                  />
                  {updateErrors.ownerUserId?.message ? (
                    <p className="text-sm font-semibold text-red-700">
                      {updateErrors.ownerUserId.message}
                    </p>
                  ) : null}
                </div>

                <button
                  className={`${secondaryButtonClassName} self-start`}
                  disabled={
                    !canEditMetadata || updateFeatureFlagMutation.isPending || isUpdateSubmitting
                  }
                  type="submit"
                >
                  {updateFeatureFlagMutation.isPending ? "Salvando..." : "Salvar metadata"}
                </button>
              </form>

              <form
                className="grid gap-3"
                noValidate
                onSubmit={handleValueSubmit(handleUpdateValue)}
              >
                <div>
                  <span className="block text-sm font-black uppercase tracking-[0.08em] text-stone-600">
                    Valor em {environmentName ?? "ambiente"}
                  </span>
                  <strong className="text-slate-900">{selectedFlag.key}</strong>
                </div>

                {selectedFlag.type === "boolean" ? (
                  <select
                    className={fieldClassName}
                    disabled={!canEditValue || updateValueMutation.isPending || isValueSubmitting}
                    {...registerValue("defaultValue")}
                  >
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                ) : (
                  <input
                    className={fieldClassName}
                    disabled={!canEditValue || updateValueMutation.isPending || isValueSubmitting}
                    placeholder={defaultValueForType(selectedFlag.type)}
                    step={selectedFlag.type === "integer" ? "1" : "any"}
                    type={selectedFlag.type === "string" ? "text" : "number"}
                    {...registerValue("defaultValue")}
                  />
                )}

                <div className="grid gap-2">
                  <label
                    className="text-sm font-black uppercase tracking-[0.08em] text-stone-600"
                    htmlFor="feature-flag-rules-json"
                  >
                    Rules JSON
                  </label>
                  <textarea
                    aria-invalid={valueErrors.rulesJson ? true : undefined}
                    className={`${fieldClassName} min-h-28 font-mono text-sm`}
                    disabled={!canEditValue || updateValueMutation.isPending || isValueSubmitting}
                    id="feature-flag-rules-json"
                    placeholder="[]"
                    {...registerValue("rulesJson")}
                  />
                  {valueErrors.rulesJson?.message ? (
                    <p className="text-sm font-semibold text-red-700">
                      {valueErrors.rulesJson.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <label
                    className="text-sm font-black uppercase tracking-[0.08em] text-stone-600"
                    htmlFor="feature-flag-percentage-attribute"
                  >
                    Atributo de rollout
                  </label>
                  <input
                    aria-invalid={valueErrors.percentageAttribute ? true : undefined}
                    className={fieldClassName}
                    disabled={!canEditValue || updateValueMutation.isPending || isValueSubmitting}
                    id="feature-flag-percentage-attribute"
                    placeholder="identifier"
                    {...registerValue("percentageAttribute")}
                  />
                  {valueErrors.percentageAttribute?.message ? (
                    <p className="text-sm font-semibold text-red-700">
                      {valueErrors.percentageAttribute.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <label
                    className="text-sm font-black uppercase tracking-[0.08em] text-stone-600"
                    htmlFor="feature-flag-percentage-options-json"
                  >
                    Rollout percentual JSON
                  </label>
                  <textarea
                    aria-invalid={valueErrors.percentageOptionsJson ? true : undefined}
                    className={`${fieldClassName} min-h-28 font-mono text-sm`}
                    disabled={!canEditValue || updateValueMutation.isPending || isValueSubmitting}
                    id="feature-flag-percentage-options-json"
                    placeholder="[]"
                    {...registerValue("percentageOptionsJson")}
                  />
                  {valueErrors.percentageOptionsJson?.message ? (
                    <p className="text-sm font-semibold text-red-700">
                      {valueErrors.percentageOptionsJson.message}
                    </p>
                  ) : null}
                </div>

                {!environmentId ? (
                  <p className="text-sm text-stone-600">
                    Selecione um ambiente para editar o valor.
                  </p>
                ) : null}
                {valueFormError ? (
                  <p className="text-sm font-semibold text-red-700">{valueFormError}</p>
                ) : null}
                <ErrorMessage error={updateValueMutation.error} />

                <button
                  className={`${secondaryButtonClassName} self-start`}
                  disabled={!canEditValue || updateValueMutation.isPending || isValueSubmitting}
                  type="submit"
                >
                  {updateValueMutation.isPending ? "Salvando..." : "Salvar valor"}
                </button>
              </form>
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
