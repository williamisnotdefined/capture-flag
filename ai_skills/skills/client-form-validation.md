# Client Form Validation

Use this skill when adding or changing forms in `apps/client`.

## Rules

- Use `react-hook-form` for client form state and submission.
- Use `zod` for form schemas.
- Connect schemas with `zodResolver` from `@hookform/resolvers/zod`.
- Prefer `handleSubmit` over manual `FormData` parsing in React components.
- Use `defaultValues` for every registered field.
- Use `noValidate` on forms so Zod owns validation messages.
- Keep schemas close to the form unless reused by multiple forms.
- Trim string values before sending them to API mutations.
- Omit optional empty string values from mutation payloads instead of sending `""`.
- Keep server errors in mutation state and field errors in React Hook Form state.

## Client Convention

- Import `useForm` from `react-hook-form`.
- Import `z` from `zod`.
- Import `zodResolver` from `@hookform/resolvers/zod`.
- Name field types after the form, such as `CreateProjectFormValues`.
- Use `aria-invalid` on invalid fields.
- Display field errors next to the field that owns them.
- Keep React Query mutation hooks responsible for API calls and cache invalidation.

## Example

```tsx
const createNameFormSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Use ate 120 caracteres."),
});

type CreateNameFormValues = z.infer<typeof createNameFormSchema>;

const { formState, handleSubmit, register, reset } = useForm<CreateNameFormValues>({
  defaultValues: { name: "" },
  resolver: zodResolver(createNameFormSchema),
});

async function submit(values: CreateNameFormValues) {
  await mutation.mutateAsync(values.name);
  reset();
}
```

## Verification

- Check that forms no longer rely on browser `required` or manual `FormData` validation.
- Check that optional empty values are not sent as empty strings.
- Run `npm --workspace @capture-flag/client run build` after form changes.
