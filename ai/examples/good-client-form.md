# Good Client Form

Source: `apps/client/src/components/CreateNameForm.tsx` (sha256: `e60e8092b9d41bd7a2b5136ff048d6b5455abe40c796386dea079369b823e1e3`)
Source: `apps/client/src/pages/FlagsPage/featureFlags/CreateFeatureFlagForm.tsx` (sha256: `a7d1e86cdb9b5082b43efe4959ecae33eb6eeda011e2a78d8df8fc7ed8a76b02`)

Why this is canonical:

- Keeps schema, default values, field errors, and submission in the owning form.
- Uses React Hook Form with `zodResolver` and `noValidate`.
- Shows field errors beside the field that owns them.
- Uses a local `FormField` wrapper in complex forms to reduce repeated label/control/error markup.

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

## Local Field Wrapper For Complex Forms

```tsx
<FormField error={errors.key?.message} label="Key do SDK" required htmlFor={keyId}>
  <TextInput
    aria-invalid={errors.key ? true : undefined}
    autoComplete="off"
    disabled={isDisabled}
    id={keyId}
    placeholder="newCheckout"
    {...register("key")}
  />
</FormField>
```

```tsx
function FormField({ children, error, htmlFor, label, required = false }: FormFieldProps) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}
```

This pattern is local to the owning form and avoids promoting page-specific field structure into shared components too early.
