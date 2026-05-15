import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateSegment,
  useDeleteSegment,
  useGetConfigSegments,
  useUpdateSegment,
} from "../../../api/segments";
import {
  Button,
  ErrorMessage,
  Eyebrow,
  FieldError,
  Panel,
  PermissionHint,
  TextInput,
  TextareaInput,
} from "../../../components";
import { useProjectResourcesRouteContext } from "../../../layouts/PlatformLayout/useRouteContext";
import { canManageSegments as canManageSegmentActions } from "../../../permissions";
import type { Segment } from "../../../types";
import { useSegmentSelection } from "./useSegmentSelection";

const segmentOperators = [
  "equals",
  "notEquals",
  "contains",
  "startsWith",
  "endsWith",
  "oneOf",
  "arrayContains",
  "greaterThan",
  "lessThan",
  "dateBefore",
  "dateAfter",
  "semverEquals",
  "semverGreaterThan",
  "semverGreaterThanOrEquals",
  "semverLessThan",
  "semverLessThanOrEquals",
] as const;

type SegmentOperator = (typeof segmentOperators)[number];

const semverOperators = [
  "semverEquals",
  "semverGreaterThan",
  "semverGreaterThanOrEquals",
  "semverLessThan",
  "semverLessThanOrEquals",
] as const;

const maxSegmentConditions = 50;

const segmentFormSchema = z.object({
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
  description: z.string().max(500, "Use ate 500 caracteres."),
  conditionsJson: z.string(),
});

type SegmentFormValues = z.infer<typeof segmentFormSchema>;

export function SegmentsPanel() {
  const {
    organizationRole,
    selectedConfigId: configId,
    selectedProject,
  } = useProjectResourcesRouteContext();
  const canManageSegments = canManageSegmentActions(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );
  const segmentsQuery = useGetConfigSegments(configId);
  const segments = segmentsQuery.data ?? [];
  const { clearSegmentSelection, selectCreatedSegment, selectSegmentId, selectedSegment } =
    useSegmentSelection(segments);
  const createSegmentMutation = useCreateSegment({
    configId,
    onSuccess: selectCreatedSegment,
  });
  const updateSegmentMutation = useUpdateSegment({ configId });
  const deleteSegmentMutation = useDeleteSegment({
    configId,
    onSuccess: clearSegmentSelection,
  });
  const canCreateSegment = Boolean(configId && canManageSegments);
  const canEditSegment = Boolean(selectedSegment && configId && canManageSegments);

  async function handleCreateSegment(values: SegmentFormValues) {
    const conditionsJson = parseSegmentConditions(values.conditionsJson);
    const description = values.description.trim();

    await createSegmentMutation.mutateAsync({
      key: values.key.trim(),
      name: values.name.trim(),
      ...(description ? { description } : {}),
      conditionsJson,
    });
  }

  async function handleUpdateSegment(values: SegmentFormValues) {
    if (!selectedSegment) {
      return;
    }

    await updateSegmentMutation.mutateAsync({
      segmentId: selectedSegment.id,
      key: values.key.trim(),
      name: values.name.trim(),
      description: values.description.trim(),
      conditionsJson: parseSegmentConditions(values.conditionsJson),
    });
  }

  return (
    <Panel title="Segments" wide>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid gap-4">
          <SegmentForm
            disabled={!canCreateSegment || createSegmentMutation.isPending}
            mode="create"
            onSubmit={handleCreateSegment}
          />

          {!canManageSegments ? (
            <PermissionHint>
              Voce precisa ser project_admin, owner ou admin para gerenciar segmentos.
            </PermissionHint>
          ) : null}
          <ErrorMessage error={segmentsQuery.error} />
          <ErrorMessage error={createSegmentMutation.error} />
          <ErrorMessage error={deleteSegmentMutation.error} />
          <ErrorMessage error={updateSegmentMutation.error} />

          <div className="rounded-2xl bg-[#f4f0e8] p-4">
            <Eyebrow>Segmentos desta config</Eyebrow>
            {segments.length === 0 ? (
              <p className="mt-2 text-sm text-stone-600">Nenhum segmento criado.</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {segments.map((segment) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/70 p-3"
                    key={segment.id}
                  >
                    <button
                      className="text-left"
                      onClick={() => selectSegmentId(segment.id)}
                      type="button"
                    >
                      <strong className="block text-slate-900">{segment.name}</strong>
                      <span className="text-sm text-stone-600">{segment.key}</span>
                    </button>
                    <Button
                      disabled={!canManageSegments || deleteSegmentMutation.isPending}
                      onClick={() => deleteSegmentMutation.mutate(segment.id)}
                      type="button"
                      variant="danger"
                    >
                      Remover
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-[#f4f0e8] p-4">
          {selectedSegment ? (
            <SegmentForm
              disabled={!canEditSegment || updateSegmentMutation.isPending}
              mode="update"
              onSubmit={handleUpdateSegment}
              segment={selectedSegment}
            />
          ) : (
            <p className="text-sm text-stone-600">
              Selecione ou crie um segmento para editar suas condicoes.
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}

type SegmentFormProps = {
  disabled: boolean;
  mode: "create" | "update";
  onSubmit: (values: SegmentFormValues) => Promise<unknown>;
  segment?: Segment;
};

function SegmentForm({ disabled, mode, onSubmit, segment }: SegmentFormProps) {
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<SegmentFormValues>({
    defaultValues: emptySegmentFormValues(),
    resolver: zodResolver(segmentFormSchema),
  });

  useEffect(() => {
    if (!segment) {
      reset(emptySegmentFormValues());
      return;
    }

    reset({
      key: segment.key,
      name: segment.name,
      description: segment.description ?? "",
      conditionsJson: jsonArrayToInput(segment.conditionsJson),
    });
  }, [reset, segment]);

  async function submit(values: SegmentFormValues) {
    clearErrors("conditionsJson");

    try {
      parseSegmentConditions(values.conditionsJson);
    } catch (error) {
      setError("conditionsJson", {
        message: error instanceof Error ? error.message : "Condicoes invalidas.",
      });
      return;
    }

    try {
      await onSubmit(values);
      if (mode === "create") {
        reset(emptySegmentFormValues());
      }
    } catch {
      // Mutation hooks expose the error state in the panel.
    }
  }

  const isDisabled = disabled || isSubmitting;

  return (
    <form className="grid gap-3" noValidate onSubmit={handleSubmit(submit)}>
      <div>
        <Eyebrow>{mode === "create" ? "Novo segmento" : "Editar segmento"}</Eyebrow>
        {segment ? <strong className="text-slate-900">{segment.key}</strong> : null}
      </div>

      <div className="grid gap-2">
        <TextInput
          aria-invalid={errors.key ? true : undefined}
          disabled={isDisabled}
          placeholder="beta-users"
          {...register("key")}
        />
        <FieldError>{errors.key?.message}</FieldError>
      </div>

      <div className="grid gap-2">
        <TextInput
          aria-invalid={errors.name ? true : undefined}
          disabled={isDisabled}
          placeholder="Beta users"
          {...register("name")}
        />
        <FieldError>{errors.name?.message}</FieldError>
      </div>

      <div className="grid gap-2">
        <TextInput
          aria-invalid={errors.description ? true : undefined}
          disabled={isDisabled}
          placeholder="Descricao opcional"
          {...register("description")}
        />
        <FieldError>{errors.description?.message}</FieldError>
      </div>

      <div className="grid gap-2">
        <label
          className="text-sm font-black uppercase tracking-[0.08em] text-stone-600"
          htmlFor={`segment-conditions-${mode}`}
        >
          Conditions JSON
        </label>
        <TextareaInput
          aria-invalid={errors.conditionsJson ? true : undefined}
          className="min-h-36 font-mono text-sm"
          disabled={isDisabled}
          id={`segment-conditions-${mode}`}
          placeholder={segmentConditionsPlaceholder}
          {...register("conditionsJson")}
        />
        <p className="text-xs text-stone-600">
          Use em rules com uma condition como {`{ "segment": "${segment?.key ?? "beta-users"}" }`}.
        </p>
        {segment && Array.isArray(segment.conditionsJson) && segment.conditionsJson.length === 0 ? (
          <p className="text-xs font-semibold text-amber-700">
            Este segmento nao faz match ate receber ao menos uma condition.
          </p>
        ) : null}
        <FieldError>{errors.conditionsJson?.message}</FieldError>
      </div>

      <Button className="self-start" disabled={isDisabled} type="submit" variant="secondary">
        {mode === "create" ? "Criar segmento" : "Salvar segmento"}
      </Button>
    </form>
  );
}

const segmentConditionsPlaceholder = `[
  {
    "attribute": "email",
    "operator": "endsWith",
    "value": "@example.com"
  }
]`;

function emptySegmentFormValues(): SegmentFormValues {
  return {
    key: "",
    name: "",
    description: "",
    conditionsJson: "[]",
  };
}

function jsonArrayToInput(value: unknown) {
  return JSON.stringify(Array.isArray(value) ? value : [], null, 2);
}

export function parseSegmentConditions(value: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return [];
  }

  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(normalizedValue);
  } catch {
    throw new Error("Conditions deve ser um JSON valido.");
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error("Conditions deve ser um array JSON.");
  }

  if (parsedValue.length > maxSegmentConditions) {
    throw new Error(`Use no maximo ${maxSegmentConditions} conditions.`);
  }

  return parsedValue.map((condition) => normalizeSegmentCondition(condition));
}

function normalizeSegmentCondition(condition: unknown) {
  if (!condition || typeof condition !== "object" || Array.isArray(condition)) {
    throw new Error("Conditions deve conter objetos.");
  }

  const record = condition as Record<string, unknown>;
  const attribute = typeof record.attribute === "string" ? record.attribute.trim() : "";
  if (!attribute) {
    throw new Error("Cada condition precisa de attribute.");
  }

  if (attribute.length > 80) {
    throw new Error("Attribute deve ter ate 80 caracteres.");
  }

  if (!segmentOperators.includes(record.operator as (typeof segmentOperators)[number])) {
    throw new Error("Cada condition precisa de um operator valido.");
  }

  if (!Object.prototype.hasOwnProperty.call(record, "value")) {
    throw new Error("Cada condition precisa de value.");
  }

  assertConditionValueMatchesOperator(record.operator as SegmentOperator, record.value);

  if (Object.prototype.hasOwnProperty.call(record, "segment")) {
    throw new Error("Segmentos nao podem referenciar outros segmentos.");
  }

  if (Object.prototype.hasOwnProperty.call(record, "prerequisiteFlag")) {
    throw new Error("Segmentos nao podem referenciar prerequisite flags.");
  }

  return {
    attribute,
    operator: record.operator,
    value: record.value,
  };
}

function assertConditionValueMatchesOperator(operator: SegmentOperator, value: unknown) {
  if ((operator === "equals" || operator === "notEquals") && !isComparableValue(value)) {
    throw new Error("Comparacao de igualdade precisa de value string, numero, booleano ou null.");
  }

  if (
    (operator === "contains" || operator === "startsWith" || operator === "endsWith") &&
    typeof value !== "string"
  ) {
    throw new Error(`${operator} precisa de value string.`);
  }

  if (operator === "oneOf" && (!Array.isArray(value) || !value.every(isComparableValue))) {
    throw new Error("oneOf precisa de array de strings, numeros, booleanos ou null.");
  }

  if ((operator === "greaterThan" || operator === "lessThan") && !isFiniteNumber(value)) {
    throw new Error(`${operator} precisa de value numerico finito.`);
  }

  if (operator === "arrayContains" && !isComparableValue(value)) {
    throw new Error("arrayContains precisa de value string, numero, booleano ou null.");
  }

  if ((operator === "dateBefore" || operator === "dateAfter") && !isDateValue(value)) {
    throw new Error("Comparacao de data precisa de value como data valida ou timestamp.");
  }

  if (isSemVerOperator(operator) && !isSemVerValue(value)) {
    throw new Error("Comparacao SemVer precisa de value SemVer valido.");
  }
}

function isComparableValue(value: unknown) {
  return (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string" ||
    isFiniteNumber(value)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isDateValue(value: unknown) {
  if (isFiniteNumber(value)) {
    return true;
  }

  return typeof value === "string" && isIsoDateValue(value);
}

function isSemVerOperator(value: SegmentOperator): value is (typeof semverOperators)[number] {
  return semverOperators.includes(value as (typeof semverOperators)[number]);
}

function isSemVerValue(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  let normalizedValue = value;
  const buildSeparatorIndex = normalizedValue.indexOf("+");
  if (buildSeparatorIndex !== -1) {
    const buildMetadata = normalizedValue.slice(buildSeparatorIndex + 1);
    if (!isValidSemVerIdentifierList(buildMetadata, true)) {
      return false;
    }

    normalizedValue = normalizedValue.slice(0, buildSeparatorIndex);
  }

  if (normalizedValue.includes("+")) {
    return false;
  }

  const prereleaseSeparatorIndex = normalizedValue.indexOf("-");
  const versionCore =
    prereleaseSeparatorIndex === -1
      ? normalizedValue
      : normalizedValue.slice(0, prereleaseSeparatorIndex);
  const prereleaseValue =
    prereleaseSeparatorIndex === -1
      ? undefined
      : normalizedValue.slice(prereleaseSeparatorIndex + 1);

  return isValidSemVerCore(versionCore) && isValidSemVerPrerelease(prereleaseValue);
}

function isValidSemVerCore(value: string) {
  const parts = value.split(".");
  if (parts.length !== 3) {
    return false;
  }

  return parts.every((part) => {
    if (!/^(0|[1-9]\d*)$/.test(part)) {
      return false;
    }

    return Number.isSafeInteger(Number(part));
  });
}

function isValidSemVerPrerelease(value: string | undefined) {
  if (value === undefined) {
    return true;
  }

  return isValidSemVerIdentifierList(value, false);
}

function isValidSemVerIdentifierList(value: string, allowNumericLeadingZeros: boolean) {
  if (!value) {
    return false;
  }

  return value.split(".").every((identifier) => {
    if (!/^[0-9A-Za-z-]+$/.test(identifier)) {
      return false;
    }

    if (!allowNumericLeadingZeros && /^\d+$/.test(identifier)) {
      return /^(0|[1-9]\d*)$/.test(identifier) && Number.isSafeInteger(Number(identifier));
    }

    return true;
  });
}

function isIsoDateValue(value: string) {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    return isValidDateParts(dateOnlyMatch[1], dateOnlyMatch[2], dateOnlyMatch[3]);
  }

  const dateTimeMatch =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!dateTimeMatch) {
    return false;
  }

  return (
    isValidDateParts(dateTimeMatch[1], dateTimeMatch[2], dateTimeMatch[3]) &&
    Number(dateTimeMatch[4]) <= 23 &&
    Number(dateTimeMatch[5]) <= 59 &&
    Number(dateTimeMatch[6]) <= 59 &&
    Number.isFinite(Date.parse(value))
  );
}

function isValidDateParts(year: string, month: string, day: string) {
  const yearValue = Number(year);
  const monthValue = Number(month);
  const dayValue = Number(day);
  if (monthValue < 1 || monthValue > 12 || dayValue < 1) {
    return false;
  }

  return dayValue <= new Date(Date.UTC(yearValue, monthValue, 0)).getUTCDate();
}
