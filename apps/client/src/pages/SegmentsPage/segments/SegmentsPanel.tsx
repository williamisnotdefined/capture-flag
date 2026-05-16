import { zodResolver } from "@hookform/resolvers/zod";
import { useDeferredValue, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateSegment,
  useDeleteSegment,
  useGetConfigSegments,
  useUpdateSegment,
} from "../../../api/segments";
import {
  ActionMenu,
  ActionMenuItem,
  Button,
  ClickableTableRow,
  DataTablePagination,
  DataToolbar,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ErrorMessage,
  Eyebrow,
  FieldError,
  Panel,
  PermissionHint,
  SearchField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
  TextareaInput,
} from "../../../components";
import { isDateValue } from "../../../core/date/isDateValue";
import { useCollectionSelection } from "../../../core/hooks/useCollectionSelection";
import { jsonArrayToInput } from "../../../core/json/jsonArrayToInput";
import { parseJsonArray } from "../../../core/json/parseJsonArray";
import { isComparableValue } from "../../../core/validation/isComparableValue";
import { isFiniteNumber } from "../../../core/validation/isFiniteNumber";
import { isSemVerValue } from "../../../core/validation/isSemVerValue";
import { canManageSegments as canManageSegmentActions } from "../../../permissions";
import { useProjectResourcesRouteContext } from "../../../routing/useRouteContext";
import type { Segment } from "../../../types";

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

type SegmentsPanelProps = {
  isCreateOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
};

export function SegmentsPanel({ isCreateOpen, onCreateOpenChange }: SegmentsPanelProps) {
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
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const deferredSearchInput = useDeferredValue(searchInput.trim().toLowerCase());
  const visibleSegments = segments.filter((segment) => {
    if (!deferredSearchInput) {
      return true;
    }

    return [segment.name, segment.key, segment.description ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(deferredSearchInput);
  });
  const pageCount = Math.max(1, Math.ceil(visibleSegments.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedSegments = visibleSegments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const {
    clearSelection: clearSegmentSelection,
    selectId: selectSegmentId,
    selectPendingItem: selectCreatedSegment,
    selectedItem: selectedSegment,
  } = useCollectionSelection(segments);
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
    onCreateOpenChange(false);
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
    <Panel showTitle={false} title="Segments" wide>
      <Dialog open={isCreateOpen} onOpenChange={onCreateOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar segment</DialogTitle>
            <DialogDescription>
              Defina key, nome e conditions JSON para reutilizar em regras de flags.
            </DialogDescription>
          </DialogHeader>
          <SegmentForm
            disabled={!canCreateSegment || createSegmentMutation.isPending}
            mode="create"
            onSubmit={handleCreateSegment}
          />
          <ErrorMessage error={createSegmentMutation.error} />
        </DialogContent>
      </Dialog>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid gap-4">
          {!canManageSegments ? (
            <PermissionHint>
              Voce precisa ser project_admin, owner ou admin para gerenciar segmentos.
            </PermissionHint>
          ) : null}
          <ErrorMessage error={segmentsQuery.error} />
          <ErrorMessage error={deleteSegmentMutation.error} />
          <ErrorMessage error={updateSegmentMutation.error} />

          <DataToolbar>
            <SearchField
              aria-label="Filtrar segments"
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(1);
              }}
              placeholder="Filter by name, key or description..."
              value={searchInput}
            />
          </DataToolbar>
          <div className="overflow-hidden rounded-md border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead className="w-10 text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSegments.length > 0 ? (
                  paginatedSegments.map((segment) => (
                    <ClickableTableRow
                      aria-label={`Editar ${segment.name}`}
                      data-state={selectedSegment?.id === segment.id ? "selected" : undefined}
                      key={segment.id}
                      onActivate={() => selectSegmentId(segment.id)}
                    >
                      <TableCell className="min-w-52">
                        <div className="text-left">
                          <strong className="block text-foreground">{segment.name}</strong>
                          <span className="font-mono text-xs text-muted-foreground">
                            {segment.key}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {Array.isArray(segment.conditionsJson) ? segment.conditionsJson.length : 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionMenu label={`Acoes para ${segment.name}`}>
                          <ActionMenuItem onClick={() => selectSegmentId(segment.id)}>
                            Editar
                          </ActionMenuItem>
                          <ActionMenuItem
                            destructive
                            disabled={!canManageSegments || deleteSegmentMutation.isPending}
                            onClick={() => deleteSegmentMutation.mutate(segment.id)}
                          >
                            Remover
                          </ActionMenuItem>
                        </ActionMenu>
                      </TableCell>
                    </ClickableTableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="h-24 text-center text-muted-foreground" colSpan={3}>
                      {segments.length === 0
                        ? "Nenhum segmento criado."
                        : "Nenhum segment encontrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
            page={currentPage}
            pageSize={pageSize}
            totalItems={visibleSegments.length}
          />
        </div>

        <div className="rounded-md border border-border bg-muted/30 p-3">
          {selectedSegment ? (
            <SegmentForm
              disabled={!canEditSegment || updateSegmentMutation.isPending}
              mode="update"
              onSubmit={handleUpdateSegment}
              segment={selectedSegment}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
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
        {segment ? <strong className="text-foreground">{segment.key}</strong> : null}
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
          className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
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
        <p className="text-xs text-muted-foreground">
          Use em rules com uma condition como {`{ "segment": "${segment?.key ?? "beta-users"}" }`}.
        </p>
        {segment && Array.isArray(segment.conditionsJson) && segment.conditionsJson.length === 0 ? (
          <p className="text-xs font-semibold text-amber-700">
            Este segmento nao faz match ate receber ao menos uma condition.
          </p>
        ) : null}
        <FieldError>{errors.conditionsJson?.message}</FieldError>
      </div>

      <Button
        className="self-start justify-self-start"
        disabled={isDisabled}
        type="submit"
        variant="secondary"
      >
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

export function parseSegmentConditions(value: string) {
  const parsedValue = parseJsonArray(value, "Conditions");

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

function isSemVerOperator(value: SegmentOperator): value is (typeof semverOperators)[number] {
  return semverOperators.includes(value as (typeof semverOperators)[number]);
}
