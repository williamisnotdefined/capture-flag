---
name: "client-componentization"
description: "Use when adding, changing, extracting, or reusing client components, including Storybook stories and controls."
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../../ai/skills/client-componentization.md`.

Referenced context:
- `../../../ai/rules/client-component-rules.md`
- `../../../ai/rules/client-state-rules.md`
- `../../../ai/rules/client-form-rules.md`
- `../../../ai/architecture/client-app.md`
- `../../../ai/examples/good-client-component.md`
- `../../../ai/examples/good-client-form.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: client-componentization

## Canonical Skill: `ai/skills/client-componentization.md`

# Client Componentization

Use this skill when adding, changing, extracting, or reusing React components, repeated UI, large components, route-level screens, or form-heavy UI in `apps/client`.

## Goal

Split UI by real ownership and reuse without creating a broad component library or hiding state in god hooks/providers.

## Read First

- `ai/rules/client-component-rules.md`
- `ai/rules/client-state-rules.md`
- `ai/rules/client-form-rules.md`
- `ai/architecture/client-app.md`
- `ai/examples/good-client-component.md`
- `ai/examples/good-client-form.md`

## Workflow

- Identify whether the change is shared UI, page-specific UI, form behavior, or state ownership cleanup.
- Keep one-off UI inline unless extraction improves reuse, naming, or state boundaries.
- Move shared primitives to `src/components`, page-specific pieces under the owning page folder, and layout-specific pieces under the owning layout folder.
- Prefer small child components and focused hooks over a single large route component.
- Reuse existing form and visual primitives before adding new ones.
- Add or update the matching Storybook story for every changed component.
- Place Storybook stories under the owning `stories/` child folder.
- Expose Storybook controls or actions for every public prop explicitly declared by the component.

## Expected Output

- Route components read as composition.
- Props remain explicit and small.
- Server state remains in React Query hooks.
- Mutable UI state stays local, nearest-owner, or in focused hooks.
- Component stories document normal, empty, disabled, permission-limited, and error states when those states exist.
- Storybook `args` and `argTypes` stay in sync with declared component props.

## Verification

- Ensure extracted components do not change behavior.
- Run `npm --workspace @capture-flag/client run storybook:build` after Storybook, component, or story changes.
- Run `npm --workspace @capture-flag/client run build`.

# Referenced Context

## Reference: `ai/rules/client-component-rules.md`

# Client Component Rules

Rules for React component boundaries in `apps/client`.

## Always

- Extract components when UI repeats or a named component makes screen composition clearer.
- Keep shared client components in `src/components`.
- Keep context-independent utilities and reusable hooks in `src/core/<category>/<name>.ts`, with one exported function or hook per file.
- Keep route layouts that wrap nested routes in `src/layouts/<LayoutName>`.
- Keep route-level screens in `src/pages`.
- Keep page-specific components and hooks under `src/pages/<PageName>` when they are not shared outside that page.
- Import `src/core` utilities and hooks from their direct file path; do not add `index.ts` barrels under `src/core`.
- Keep React component files in `apps/client` at or below 400 lines; split larger files by real UI responsibility before they become god components.
- Keep component props small and explicit.
- Prefer `children` for layout wrappers such as cards, shells, and empty states.
- Prefer explicit JSX over array-driven rendering for a small, fixed set of known UI items.
- Extract custom hooks for repeated or stateful UI behavior.
- Turn repeated form field label/control/hint/error markup into small primitives before copying it again.
- Shared form controls must accept native props, extra `className`, `aria-invalid`, and `ref`.
- Add or update Storybook stories when adding or changing reusable, layout, page-specific, or route-level React components in `apps/client`.
- Keep Storybook stories in a `stories/` child folder next to the component folder they cover, using `*.stories.tsx`; route/panel grouping stories belong in the owning route folder's `stories/` folder.
- Add Storybook controls or actions for every public prop explicitly declared by the component; use controls for data props and actions for callbacks.

## Never

- Do not extract one-off UI when it adds indirection without reuse, naming clarity, or state-boundary value.
- Do not turn every extraction into a broad component library.
- Do not move page, domain, route, or API-specific helpers into `src/core`.
- Do not let route components become god components.
- Do not fix a god component by moving all state and effects into a god provider or god hook.
- Do not build artificial arrays just to render a handful of fixed, known navigation or action items.
- Do not use React Context for mutable UI state.
- Do not copy fetched React Query data into component state just to pass it down.
- Do not leave component prop changes without matching Storybook `args` and `argTypes` updates.

## Data-Driven Rendering

- Use arrays and `.map()` when rendering API data, dynamic collections, long repeated groups, or lists whose members are not all known at author time.
- Render items directly when the UI is a short, fixed set of known product actions or navigation entries.
- Split large files by ownership such as layout shell, sidebar, selectors, form, list, detail, and helper hooks; do not hide a large component behind a single large hook.

## Core Utilities

- Use `src/core/date`, `src/core/json`, `src/core/strings`, `src/core/validation`, or `src/core/hooks` only for helpers that are independent of Capture Flag domain context.
- Keep tests for each core helper in `src/core/<category>/__tests__/<name>.test.ts`.
- Prefer direct imports such as `../../core/json/formatJson` over barrels or grouped core imports.

## Verification

- Ensure extracted components do not change behavior.
- Check the related Storybook story was added or updated and exposes controls/actions for every public declared prop.
- Run `npm --workspace @capture-flag/client run storybook:build` after Storybook, component, or story changes.
- Run `npm --workspace @capture-flag/client run build` after component moves.

## Reference: `ai/rules/client-state-rules.md`

# Client State Rules

Rules for state ownership in `apps/client`.

## Always

- Use React Query as the source of truth for server state.
- Let mutation hooks own cache invalidation with `queryClient.invalidateQueries`.
- Use local component state for short-lived UI state owned by one component.
- Lift state only to the nearest common owner that explicitly consumes it.
- Use React Router params or search params for linkable, reload-safe, navigation state.
- Keep selection state as IDs, not duplicated entity objects.
- Reconcile selected IDs against current query data in a colocated hook.
- Move repeated, context-independent client hooks to `src/core/hooks/<hook>.ts` and import them directly from that file.
- Keep state reset rules near the state owner.

## Never

- Do not manually patch copied server arrays in components unless optimistic UI is explicitly required.
- Do not copy React Query data into Zustand or local state just to pass it to children.
- Do not import query keys into components; invalidation belongs in API mutation hooks.
- Do not use React Context for mutable state. Context is only for stable values that do not change during app lifetime.
- Do not add Zustand unless state is truly global, cross-feature, or cross-route and other ownership options are insufficient.
- Do not use Zustand as an event bus for mutation results.

## Ownership Order

1. React Query hooks under `src/api/<domain>` for server/cache state.
2. React Router params or search params for route/navigation state.
3. Nearest common page component plus focused hooks for page workflow state.
4. Local `useState` or React Hook Form state for component-only state.
5. `src/core/hooks/<hook>.ts` only for repeated hooks that are independent of page/domain context.
6. Small domain-specific Zustand store only for cross-route client state with no server backing.
7. React Context only for stable constants or immutable services.

## Reference: `ai/rules/client-form-rules.md`

# Client Form Rules

Rules for forms in `apps/client`.

## Always

- Use `react-hook-form` for client form state and submission.
- Use `zod` for form schemas.
- Connect schemas with `zodResolver` from `@hookform/resolvers/zod`.
- Use `defaultValues` for every registered field.
- Use `noValidate` on forms so Zod owns validation messages.
- Keep schemas close to the form unless reused by multiple forms.
- Trim string values before sending them to API mutations.
- Omit optional empty string values from mutation payloads instead of sending `""`.
- Use `aria-invalid` on invalid fields.
- Display field errors next to the field that owns them.
- Do not ask users to type UUIDs for human UI flows; use email, search, selects, route context, or an already selected entity instead.

## Never

- Do not parse `FormData` manually in React components when the form is owned by React.
- Do not rely on browser `required` validation for app-level messages.
- Do not keep server errors in React Hook Form field state unless they map to a specific field.
- Do not duplicate parsing, schema, and payload normalization across features when a colocated helper is clearer.
- Do not send empty optional metadata fields when creating flags.
- Do not expose raw UUID entry fields in forms for organizations, projects, configs, environments, members, flags, segments, or audit filters.

## Boundaries

- React Hook Form owns field state and field validation.
- Zod owns client-side parsing and validation messages.
- React Query mutation hooks own API calls and cache invalidation.
- Server errors should remain visible from mutation state unless mapped intentionally.

## Reference: `ai/architecture/client-app.md`

# Client App Architecture

`apps/client` is a Vite React application for the Capture Flag platform UI.

## Entry And Routing

- `src/main.tsx` owns top-level providers.
- `src/router.tsx` owns React Router route definitions.
- `src/layouts` contains route layout wrappers that render shared shells, navigation, headers, and nested `<Outlet />` regions.
- `src/pages` contains route-level screens.
- `src/components` contains shared UI used by multiple pages or sections.
- `src/core` contains context-independent client utilities and reusable hooks organized by category.
- `PlatformLayout` owns the authenticated shell, top-level resource context, and navigation around selected organization, project, config, and environment.

## Route Map

- `/login`: GitHub login screen.
- `/organizations` and `/organizations/:organizationId`: organization selection and organization members.
- `/organizations/:organizationId/projects` and `/organizations/:organizationId/projects/:projectId`: project selection and project members.
- `/organizations/:organizationId/projects/:projectId/environments`: environments for the selected project.
- `/organizations/:organizationId/projects/:projectId/configs` and `/organizations/:organizationId/projects/:projectId/configs/:configId`: configs and public Config JSON preview.
- `/organizations/:organizationId/projects/:projectId/configs/:configId/flags`: feature flags and remote config values.
- `/organizations/:organizationId/projects/:projectId/configs/:configId/segments`: reusable targeting segments.
- `/organizations/:organizationId/projects/:projectId/sdk-keys`: SDK key lifecycle for project configs/environments.
- `/organizations/:organizationId/audit-logs`: organization/project audit log timeline.

## Data Flow

- React Query owns server state such as authenticated user, organizations, projects, configs, environments, SDK keys, members, and feature flags.
- API operations live under `src/api/<domain>/<operation>`.
- Request functions perform HTTP calls and contain no React imports.
- Query and mutation hooks are the UI-facing API.
- Mutation hooks invalidate affected query keys.
- API request and hook tests mock successful responses and API errors instead of reaching a real backend.
- Route params and server state are combined by `useRouteContext` for selected resources and redirect-safe navigation paths.
- Permission gates in the client are UX only; API guards and services remain authoritative.

## UI Composition

- Route components compose page sections and own screen-level flow.
- Repeated panels, forms, controls, lists, and empty states move into named components.
- React component files should stay at or below 400 lines by splitting real responsibilities into focused files.
- Short, fixed navigation or action sets should be rendered explicitly instead of through artificial arrays.
- Page-specific components stay colocated under the page folder until reused elsewhere.
- Layout-specific components stay colocated under `src/layouts/<LayoutName>` until reused by another layout or page.
- Shared primitives live under `src/components` and are exported through `src/components/index.ts`.
- Member management uses shared `components/members` primitives with page-specific role options.
- Feature flag and segment page internals stay colocated under their page folders until reused.

## Shared Core Utilities

- Context-independent helpers and reusable client hooks live under `src/core/<category>/<name>.ts`.
- Current core categories include `date`, `json`, `strings`, `validation`, and `hooks`.
- Each core file exports one function or hook; import it from the direct file path such as `src/core/date/toDate`.
- Do not add `index.ts` barrels under `src/core`; multiple helpers require multiple explicit imports.
- Core tests live under `src/core/<category>/__tests__/<name>.test.ts` next to the category they cover.
- Client tests live in `__tests__/` child folders beside the source area they cover, mirroring Storybook `stories/` folders.
- Shared test setup and helpers live under `src/test` and provide Testing Library render helpers, React Query providers, and fetch response mocks.
- Coverage is run with `npm --workspace @capture-flag/client run test:coverage` and should stay at 90% or higher for configured client targets.
- Page, domain, API, or route-specific helpers stay colocated with their owning feature until they become context-independent reuse.

## Form Flow

- React Hook Form owns field state and submission.
- Zod schemas parse and validate form values.
- API mutation hooks submit normalized payloads and refresh server state.

## Reference: `ai/examples/good-client-component.md`

# Good Client Component

Source: `apps/client/src/components/Button.tsx` (sha256: `7e1bcb1c45c5d1a5610f108be5028ce68d34ded2c394d326428eca08702a992d`)
Source: `apps/client/src/components/Panel.tsx` (sha256: `c0dfcd9d6984e9741af7abe91c60ad8bcb30e4d8f18c3c1456bdea5882d2472f`)

Why this is canonical:

- Accepts native element props instead of inventing a custom prop surface.
- Keeps variants explicit and local to the primitive.
- Uses `classnames` as `cls` for optional classes.

Canonical shared component patterns from `apps/client/src/components`.

## Button Primitive

```tsx
import cls from "classnames";
import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const baseButtonClassName =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium shadow-xs outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const buttonClassNames: Record<ButtonVariant, string> = {
  danger:
    "border border-transparent bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
  ghost:
    "border border-transparent bg-transparent text-foreground shadow-none hover:bg-accent hover:text-accent-foreground",
  primary: "border border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button className={cls(baseButtonClassName, buttonClassNames[variant], className)} {...props} />
  );
}
```

This accepts native button props, keeps variants explicit, and uses `cls` for optional classes.

## Panel Wrapper

```tsx
export function Panel({ children, className, showTitle = true, title, wide = false }: PanelProps) {
  return (
    <section
      className={cls("grid gap-4 text-foreground", className, {
        "lg:col-span-2": wide,
      })}
    >
      {showTitle ? <h2 className="text-xl font-semibold tracking-tight">{title}</h2> : null}
      {children}
    </section>
  );
}
```

This keeps layout composition explicit through `children`, accepts optional native composition through `className`, and preserves product visual language.

## Reference: `ai/examples/good-client-form.md`

# Good Client Form

Source: `apps/client/src/components/CreateNameForm.tsx` (sha256: `e60e8092b9d41bd7a2b5136ff048d6b5455abe40c796386dea079369b823e1e3`)

Why this is canonical:

- Keeps schema, default values, field errors, and submission in the owning form.
- Uses React Hook Form with `zodResolver` and `noValidate`.
- Shows field errors beside the field that owns them.

Canonical form pattern from `apps/client/src/components/CreateNameForm.tsx`.

```tsx
const createNameFormSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Use ate 120 caracteres."),
});

type CreateNameFormValues = z.infer<typeof createNameFormSchema>;

const {
  formState: { errors, isSubmitting },
  handleSubmit,
  register,
  reset,
} = useForm<CreateNameFormValues>({
  defaultValues: {
    name: "",
  },
  resolver: zodResolver(createNameFormSchema),
});
```

```tsx
<form
  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
  noValidate
  onSubmit={handleSubmit(submit)}
>
  <div>
    <TextInput
      aria-invalid={errors.name ? true : undefined}
      disabled={isDisabled}
      placeholder={placeholder}
      {...register("name")}
    />
    <FieldError>{errors.name?.message}</FieldError>
  </div>
  <Button className="justify-self-start" disabled={isDisabled} type="submit">
    Criar
  </Button>
</form>
```

This pattern keeps schema, default values, `noValidate`, field errors, and submit reset close to the owning form.
