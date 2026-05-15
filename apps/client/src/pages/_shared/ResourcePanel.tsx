import { CreateNameForm, ErrorMessage, Panel, PermissionHint, SelectInput } from "../../components";

type ResourcePanelProps<TResource extends { id: string; key: string; name: string }> = {
  create: {
    disabled: boolean;
    error: unknown;
    onSubmit: (name: string) => Promise<unknown>;
    placeholder: string;
  };
  emptyMessage: string;
  items: TResource[];
  onSelect: (resourceId: string) => void;
  permissionHint?: string;
  queryError: unknown;
  selectedId: string;
  selectPlaceholder: string;
  title: string;
};

function resourceLabel(resource: { key: string; name: string }) {
  return `${resource.name} (${resource.key})`;
}

export function ResourcePanel<TResource extends { id: string; key: string; name: string }>({
  create,
  emptyMessage,
  items,
  onSelect,
  permissionHint,
  queryError,
  selectedId,
  selectPlaceholder,
  title,
}: ResourcePanelProps<TResource>) {
  return (
    <Panel title={title}>
      <CreateNameForm
        disabled={create.disabled}
        onSubmit={create.onSubmit}
        placeholder={create.placeholder}
      />
      {permissionHint ? <PermissionHint>{permissionHint}</PermissionHint> : null}
      <ErrorMessage error={queryError} />
      <ErrorMessage error={create.error} />
      <SelectInput
        className="mt-3 w-full"
        disabled={items.length === 0}
        onChange={(event) => onSelect(event.target.value)}
        value={selectedId}
      >
        <option value="">{selectPlaceholder}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {resourceLabel(item)}
          </option>
        ))}
      </SelectInput>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-stone-600">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-800">
          {items.map((item) => (
            <li key={item.id}>{resourceLabel(item)}</li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
