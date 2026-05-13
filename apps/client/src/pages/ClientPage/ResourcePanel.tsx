import { CreateNameForm } from "../../components/CreateNameForm";
import { ItemList } from "../../components/ItemList";
import { Panel } from "../../components/Panel";
import { ErrorMessage, PermissionHint, SelectInput } from "../../components/ui";

type ResourcePanelProps<TResource extends { id: string }> = {
  createDisabled: boolean;
  createError: unknown;
  createPlaceholder: string;
  emptyMessage: string;
  items: TResource[];
  listItems: string[];
  onCreate: (name: string) => Promise<unknown>;
  onSelect: (resourceId: string) => void;
  permissionHint?: string;
  queryError: unknown;
  renderOption: (resource: TResource) => string;
  selectedId: string;
  selectDisabled: boolean;
  selectPlaceholder: string;
  title: string;
};

export function ResourcePanel<TResource extends { id: string }>({
  createDisabled,
  createError,
  createPlaceholder,
  emptyMessage,
  items,
  listItems,
  onCreate,
  onSelect,
  permissionHint,
  queryError,
  renderOption,
  selectedId,
  selectDisabled,
  selectPlaceholder,
  title,
}: ResourcePanelProps<TResource>) {
  return (
    <Panel title={title}>
      <CreateNameForm
        disabled={createDisabled}
        onSubmit={onCreate}
        placeholder={createPlaceholder}
      />
      {permissionHint ? <PermissionHint>{permissionHint}</PermissionHint> : null}
      <ErrorMessage error={queryError} />
      <ErrorMessage error={createError} />
      <SelectInput
        className="mt-3 w-full"
        disabled={selectDisabled}
        onChange={(event) => onSelect(event.target.value)}
        value={selectedId}
      >
        <option value="">{selectPlaceholder}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {renderOption(item)}
          </option>
        ))}
      </SelectInput>
      <ItemList empty={emptyMessage} items={listItems} />
    </Panel>
  );
}
