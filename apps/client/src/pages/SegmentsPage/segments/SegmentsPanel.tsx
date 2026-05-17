import {
  useCreateSegment,
  useDeleteSegment,
  useGetConfigSegments,
  useUpdateSegment,
} from "@api/segments";
import { ActionMenu, ActionMenuItem } from "@components/ActionMenu";
import { Button } from "@components/Button";
import { DataToolbar, SearchField } from "@components/DataToolbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/Dialog";
import { ErrorMessage } from "@components/ErrorMessage";
import { Eyebrow } from "@components/Eyebrow";
import { FieldError } from "@components/FieldError";
import { TextInput, TextareaInput } from "@components/FormControls";
import { Panel } from "@components/Panel";
import { PermissionHint } from "@components/PermissionHint";
import {
  BulkActions,
  ColumnHeader,
  Pagination,
  SelectionCheckbox,
  Table,
  useTable,
} from "@components/table";
import { isDateValue } from "@core/date/isDateValue";
import { useCollectionSelection } from "@core/hooks/useCollectionSelection";
import { jsonArrayToInput } from "@core/json/jsonArrayToInput";
import { parseJsonArray } from "@core/json/parseJsonArray";
import { isComparableValue } from "@core/validation/isComparableValue";
import { isFiniteNumber } from "@core/validation/isFiniteNumber";
import { isSemVerValue } from "@core/validation/isSemVerValue";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProjectResourcesRouteContext } from "@routing/useRouteContext";
import { canManageSegments as canManageSegmentActions } from "@src/permissions";
import type { Segment } from "@src/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  const columns: ColumnDef<Segment>[] = [
    {
      cell: ({ row }) => (
        <SelectionCheckbox
          aria-label={`Selecionar ${row.original.name}`}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={(event) => row.toggleSelected(event.target.checked)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      header: ({ table }) => (
        <SelectionCheckbox
          aria-label="Selecionar segments da pagina"
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
        />
      ),
      id: "select",
      meta: { className: "w-10" },
    },
    {
      accessorFn: (segment) => segment.name,
      cell: ({ row }) => (
        <div className="text-left">
          <strong className="block text-foreground">{row.original.name}</strong>
          <span className="font-mono text-xs text-muted-foreground">{row.original.key}</span>
        </div>
      ),
      header: ({ column }) => <ColumnHeader column={column} title="Segment" />,
      id: "segment",
      meta: { tdClassName: "min-w-52" },
    },
    {
      accessorFn: segmentConditionsCount,
      cell: ({ row }) => (
        <span className="font-medium">{segmentConditionsCount(row.original)}</span>
      ),
      header: ({ column }) => <ColumnHeader column={column} title="Conditions" />,
      id: "conditions",
    },
    {
      cell: ({ row }) => (
        <ActionMenu label={`Acoes para ${row.original.name}`}>
          <ActionMenuItem onClick={() => selectSegmentId(row.original.id)}>Editar</ActionMenuItem>
          <ActionMenuItem
            destructive
            disabled={!canManageSegments || deleteSegmentMutation.isPending}
            onClick={() => deleteSegmentMutation.mutate(row.original.id)}
          >
            Remover
          </ActionMenuItem>
        </ActionMenu>
      ),
      enableHiding: false,
      enableSorting: false,
      header: "Acoes",
      id: "actions",
      meta: { className: "w-10 text-right" },
    },
  ];
  const table = useTable({
    columns,
    data: segments,
    enableRowSelection: canManageSegments && !deleteSegmentMutation.isPending,
    getRowId: (segment) => segment.id,
    globalFilterFn: (row, _columnId, filterValue) =>
      [row.original.name, row.original.key, row.original.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(String(filterValue).trim().toLowerCase()),
  });
  const selectedSegments = table.getFilteredSelectedRowModel().rows.map((row) => row.original);

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
                table.setGlobalFilter(event.target.value);
                table.setPageIndex(0);
              }}
              placeholder="Filter by name, key or description..."
              value={table.getState().globalFilter ?? ""}
            />
          </DataToolbar>
          <Table
            emptyMessage={
              segments.length === 0 ? "Nenhum segmento criado." : "Nenhum segment encontrado."
            }
            getRowAriaLabel={(row) => `Editar ${row.original.name}`}
            getRowState={(row) =>
              selectedSegment?.id === row.original.id || row.getIsSelected()
                ? "selected"
                : undefined
            }
            onRowActivate={(row) => selectSegmentId(row.original.id)}
            table={table}
          />
          <Pagination table={table} />
          <BulkActions
            selectionLabel={(selectedCount) =>
              selectedCount === 1
                ? "1 segment selecionado"
                : `${selectedCount} segments selecionados`
            }
            table={table}
          >
            <Button
              disabled={
                !canManageSegments ||
                deleteSegmentMutation.isPending ||
                selectedSegments.length === 0
              }
              onClick={() => {
                for (const segment of selectedSegments) {
                  deleteSegmentMutation.mutate(segment.id);
                }
                table.resetRowSelection();
              }}
              type="button"
              variant="danger"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Remover
            </Button>
          </BulkActions>
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
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
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

function segmentConditionsCount(segment: Segment) {
  return Array.isArray(segment.conditionsJson) ? segment.conditionsJson.length : 0;
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
