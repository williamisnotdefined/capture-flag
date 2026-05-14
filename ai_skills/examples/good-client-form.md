# Good Client Form

Source: `apps/client/src/components/CreateNameForm.tsx` (sha256: `4ff4cd3a51da9d6f4623e3ec2a3b6c63d5de232f54feb780269dbb296f593871`)

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
