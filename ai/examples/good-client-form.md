# Good Client Form

Source: `apps/client/src/components/CreateNameForm.tsx` (sha256: `f1d7abc4ffd6ca4e8fb6f24245fcc210186e9e679e496d77df051ae4f6888b22`)

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
<form className="grid gap-3" noValidate onSubmit={handleSubmit(submit)}>
  <TextInput
    aria-invalid={errors.name ? true : undefined}
    disabled={isDisabled}
    placeholder={placeholder}
    {...register("name")}
  />
  <FieldError>{errors.name?.message}</FieldError>
  <Button disabled={isDisabled} type="submit">
    Criar
  </Button>
</form>
```

This pattern keeps schema, default values, `noValidate`, field errors, and submit reset close to the owning form.
