import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import cls from "classnames";
import { Check, ChevronsUpDown, type LucideIcon, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { formatResourceLabel } from "../core/strings/formatResourceLabel";

type ResourceSwitcherResource = {
  id: string;
  key?: string;
  name: string;
  slug?: string;
};

type ResourceSwitcherProps<TItem extends ResourceSwitcherResource> = {
  collapsed: boolean;
  createDisabled?: boolean;
  createLabel: string;
  disabled: boolean;
  icon: LucideIcon;
  isActive: boolean;
  label: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  onNavigate?: () => void;
  options: TItem[];
  path: string;
  placeholder: string;
  value: string;
};

export function ResourceSwitcher<TItem extends ResourceSwitcherResource>({
  collapsed,
  createDisabled = false,
  createLabel,
  disabled,
  icon: IconComponent,
  isActive,
  label,
  onChange,
  onCreate,
  onNavigate,
  options,
  path,
  placeholder,
  value,
}: ResourceSwitcherProps<TItem>) {
  const selectedOption = options.find((option) => option.id === value);
  const ariaLabel = selectedOption
    ? `${label}: ${formatResourceLabel(selectedOption)}`
    : `${label}: ${placeholder}`;

  if (collapsed) {
    const collapsedClassName = cls(
      "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm no-underline outline-none ring-sidebar-ring transition-[color,background-color] focus-visible:ring-2",
      {
        "bg-sidebar-accent font-medium text-sidebar-accent-foreground": isActive && !disabled,
        "text-sidebar-foreground/40 opacity-60": disabled,
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground":
          !isActive && !disabled,
      },
    );
    const collapsedContent = (
      <>
        <IconComponent aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />
        <span className="sr-only">{label}</span>
      </>
    );

    if (disabled) {
      return (
        <span aria-disabled="true" className={collapsedClassName} title={ariaLabel}>
          {collapsedContent}
        </span>
      );
    }

    return (
      <Link
        aria-label={label}
        className={collapsedClassName}
        onClick={onNavigate}
        title={label}
        to={path}
      >
        {collapsedContent}
      </Link>
    );
  }

  return (
    <DropdownMenuPrimitive.Root modal={false}>
      <div
        className={cls(
          "group/context grid h-8 min-w-0 w-full grid-cols-[minmax(0,1fr)_2rem] overflow-hidden rounded-md text-sm ring-sidebar-ring transition-[width,color,background-color] focus-within:ring-2",
          {
            "bg-sidebar-accent font-medium text-sidebar-accent-foreground": isActive && !disabled,
            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground":
              !isActive && !disabled,
            "text-sidebar-foreground/40 opacity-60": disabled,
          },
        )}
      >
        {disabled ? (
          <span
            aria-disabled="true"
            className="inline-flex min-w-0 items-center gap-2 overflow-hidden p-2 text-left"
            title={ariaLabel}
          >
            <IconComponent aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="truncate">{label}</span>
          </span>
        ) : (
          <Link
            aria-label={label}
            className="inline-flex min-w-0 items-center gap-2 overflow-hidden p-2 text-left no-underline outline-none"
            onClick={onNavigate}
            title={label}
            to={path}
          >
            <IconComponent aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="truncate">{label}</span>
          </Link>
        )}
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            aria-label={`Selecionar ${label}`}
            className={cls(
              "inline-flex items-center justify-center outline-none transition-colors data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
              {
                "text-sidebar-foreground/40": disabled,
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground": !disabled,
              },
            )}
            disabled={disabled}
            title={ariaLabel}
            type="button"
          >
            <ChevronsUpDown
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-sidebar-foreground/60"
              strokeWidth={1.8}
            />
          </button>
        </DropdownMenuPrimitive.Trigger>
      </div>
      <DropdownMenuPrimitive.Content
        align="start"
        className="z-50 max-h-80 w-64 overflow-y-auto rounded-lg border border-sidebar-border bg-popover p-1 text-popover-foreground shadow-lg outline-none"
        collisionPadding={12}
        side="right"
        sideOffset={8}
      >
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{label}</div>
        {options.map((option) => {
          const isSelected = option.id === value;
          const optionMeta = formatResourceMeta(option);

          return (
            <DropdownMenuPrimitive.Item
              className={cls(
                "flex min-w-0 cursor-default items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                { "bg-accent text-accent-foreground": isSelected },
              )}
              key={option.id}
              onSelect={() => {
                onChange(option.id);
                onNavigate?.();
              }}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                <IconComponent aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
              </span>
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate font-medium">{option.name}</span>
                {optionMeta ? (
                  <span className="truncate text-xs text-muted-foreground">{optionMeta}</span>
                ) : null}
              </span>
              {isSelected ? <Check aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
            </DropdownMenuPrimitive.Item>
          );
        })}
        <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />
        <DropdownMenuPrimitive.Item
          className="flex cursor-default items-center gap-2 rounded-md px-2 py-2 text-sm font-medium outline-none transition-colors select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          disabled={createDisabled}
          onSelect={onCreate}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
            <Plus aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
          </span>
          {createLabel}
        </DropdownMenuPrimitive.Item>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Root>
  );
}

function formatResourceMeta(resource: ResourceSwitcherResource) {
  return resource.key ?? resource.slug ?? null;
}
