import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import cls from "classnames";
import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

type ThemeModeOption = {
  icon: LucideIcon;
  label: string;
  value: ThemeMode;
};

const darkModeMediaQuery = "(prefers-color-scheme: dark)";
const themeStorageKey = "capture-flag-theme";

const themeModeOptions: ThemeModeOption[] = [
  { icon: Sun, label: "Claro", value: "light" },
  { icon: Moon, label: "Escuro", value: "dark" },
  { icon: Monitor, label: "Sistema", value: "system" },
];

type ThemeModeControlProps = {
  collapsed: boolean;
};

export function ThemeModeControl({ collapsed }: ThemeModeControlProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const activeOption = getThemeModeOption(themeMode);
  const ActiveIcon = activeOption.icon;

  useEffect(() => {
    persistThemeMode(themeMode);
    applyThemeMode(themeMode);

    if (themeMode !== "system" || typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(darkModeMediaQuery);
    const handleSystemThemeChange = () => applyThemeMode("system");

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [themeMode]);

  return (
    <DropdownMenuPrimitive.Root modal={false}>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          aria-label={`Tema atual: ${activeOption.label}. Abrir opcoes de tema.`}
          className={cls(
            "inline-flex h-8 w-8 items-center justify-center rounded-md border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xs outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
            {
              "justify-self-center": collapsed,
              "justify-self-end": !collapsed,
            },
          )}
          title={`Tema: ${activeOption.label}`}
          type="button"
        >
          <ActiveIcon aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">Tema</span>
        </button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={collapsed ? "center" : "end"}
          className="z-50 min-w-40 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
          side={collapsed ? "right" : "top"}
          sideOffset={8}
        >
          <DropdownMenuPrimitive.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Tema
          </DropdownMenuPrimitive.Label>
          {themeModeOptions.map((option) => (
            <ThemeModeMenuItem
              active={option.value === themeMode}
              key={option.value}
              onSelect={() => setThemeMode(option.value)}
              option={option}
            />
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

type ThemeModeMenuItemProps = {
  active: boolean;
  onSelect: () => void;
  option: ThemeModeOption;
};

function ThemeModeMenuItem({ active, onSelect, option }: ThemeModeMenuItemProps) {
  const Icon = option.icon;

  return (
    <DropdownMenuPrimitive.Item
      className={cls(
        "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors select-none focus:bg-accent focus:text-accent-foreground",
        { "bg-accent text-accent-foreground": active },
      )}
      onSelect={onSelect}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      <span>{option.label}</span>
      {active ? <Check aria-hidden="true" className="ml-auto h-4 w-4" /> : null}
    </DropdownMenuPrimitive.Item>
  );
}

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    return parseThemeMode(window.localStorage.getItem(themeStorageKey));
  } catch {
    return "system";
  }
}

function parseThemeMode(value: string | null): ThemeMode {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

function persistThemeMode(themeMode: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(themeStorageKey, themeMode);
  } catch {
    // Theme selection is best-effort when storage is unavailable.
  }
}

function applyThemeMode(themeMode: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && window.matchMedia(darkModeMediaQuery).matches);

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

function getThemeModeOption(themeMode: ThemeMode) {
  return themeModeOptions.find((option) => option.value === themeMode) ?? themeModeOptions[2];
}
