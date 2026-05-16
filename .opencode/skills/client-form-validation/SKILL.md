---
name: "client-form-validation"
description: "Use when adding or changing forms in apps/client."
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../../ai/skills/client-form-validation.md`.

Referenced context:
- `../../../ai/rules/client-form-rules.md`
- `../../../ai/rules/client-component-rules.md`
- `../../../ai/rules/client-api-hook-rules.md`
- `../../../ai/examples/good-client-form.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: client-form-validation

## Canonical Skill: `ai/skills/client-form-validation.md`

# Client Form Validation

Use this skill when adding or changing forms in `apps/client`.

## Goal

Build forms whose field state, schema validation, payload normalization, and mutation boundaries match existing client patterns.

## Read First

- `ai/rules/client-form-rules.md`
- `ai/rules/client-component-rules.md`
- `ai/rules/client-api-hook-rules.md`
- `ai/examples/good-client-form.md`

## Workflow

- Define or update the Zod schema near the owning form unless reused.
- Use React Hook Form with `defaultValues`, `zodResolver`, and `handleSubmit`.
- Normalize optional strings before sending mutation payloads.
- Keep field errors next to fields and server errors in mutation state unless mapped intentionally.
- Reuse shared form controls that accept native props, `className`, `aria-invalid`, and `ref`.

## Expected Output

- Forms use `noValidate`.
- Browser `required` and manual `FormData` parsing do not own validation.
- Optional empty values are omitted or converted according to the API contract.
- Mutation hooks still own API calls and cache invalidation.

## Verification

- Check forms do not rely on browser validation for app messages.
- Check optional empty values are not sent as empty strings.
- Run `npm --workspace @capture-flag/client run build`.

# Referenced Context

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

## Reference: `ai/rules/client-api-hook-rules.md`

# Client API Hook Rules

Rules for client API operations in `apps/client/src/api`.

## Always

- Group API code by domain and operation under `apps/client/src/api`.
- Split every operation into a request function, a React Query hook, and an operation `index.ts`.
- Keep request functions free of React imports.
- Keep request functions typed with the response type they return.
- Use `useQuery` in query hooks and `useMutation` in mutation hooks.
- Keep query keys stable in a domain-level `queryKeys.ts` when hooks or mutations share them.
- Use `enabled` in query hooks when required IDs or inputs are unavailable.
- Invalidate affected query keys inside mutation hooks.
- Use explicit named exports in UI-facing barrels.

## Never

- Do not call raw request functions from components.
- Do not expose request functions from operation or domain barrels used by UI.
- Do not import domain `queryKeys` into components.
- Do not manually synchronize server lists in components after mutations.
- Do not mirror query data into Zustand or local state unless a concrete UI-only draft workflow requires it.
- Do not create a central `src/api/queryKeys.ts` unless data is genuinely cross-domain.

## Layout

- Request file: `apps/client/src/api/<domain>/<operation>/<operation>.ts`.
- Hook file: `apps/client/src/api/<domain>/<operation>/use<Operation>.ts`.
- Operation barrel: `apps/client/src/api/<domain>/<operation>/index.ts`.
- Domain barrel: `apps/client/src/api/<domain>/index.ts`.
- Query keys: `apps/client/src/api/<domain>/queryKeys.ts`.

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
