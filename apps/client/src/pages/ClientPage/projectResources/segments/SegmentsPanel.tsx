import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateSegment,
  useDeleteSegment,
  useGetConfigSegments,
  useUpdateSegment,
} from "../../../../api/segments";
import {
  Button,
  ErrorMessage,
  Eyebrow,
  FieldError,
  Panel,
  PermissionHint,
  TextInput,
  TextareaInput,
} from "../../../../components";
import type { Segment } from "../../../../types";
import { useSegmentSelection } from "./useSegmentSelection";

const segmentOperators = [
  "equals",
  "notEquals",
  "contains",
  "startsWith",
  "endsWith",
  "oneOf",
  "greaterThan",
  "lessThan",
  "semverGreaterThanOrEquals",
  "semverLessThan",
] as const;

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

type SegmentsPanelProps = {
  canManageSegments: boolean;
  configId: string;
};

export function SegmentsPanel({ canManageSegments, configId }: SegmentsPanelProps) {
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
              Voce precisa ser developer, project_admin, owner ou admin para gerenciar segmentos.
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

function parseSegmentConditions(value: string) {
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

  if (!segmentOperators.includes(record.operator as (typeof segmentOperators)[number])) {
    throw new Error("Cada condition precisa de um operator valido.");
  }

  if (!Object.prototype.hasOwnProperty.call(record, "value")) {
    throw new Error("Cada condition precisa de value.");
  }

  if (Object.prototype.hasOwnProperty.call(record, "segment")) {
    throw new Error("Segmentos nao podem referenciar outros segmentos.");
  }

  return {
    attribute,
    operator: record.operator,
    value: record.value,
  };
}
