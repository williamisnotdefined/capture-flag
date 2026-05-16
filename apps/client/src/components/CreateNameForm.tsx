import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./Button";
import { FieldError } from "./FieldError";
import { TextInput } from "./FormControls";

const createNameFormSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Use ate 120 caracteres."),
});

type CreateNameFormValues = z.infer<typeof createNameFormSchema>;

type CreateNameFormProps = {
  disabled?: boolean;
  dividedFooter?: boolean;
  onSubmit: (name: string) => Promise<unknown> | unknown;
  placeholder: string;
};

export function CreateNameForm({
  disabled = false,
  dividedFooter = false,
  onSubmit,
  placeholder,
}: CreateNameFormProps) {
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

  const isDisabled = disabled || isSubmitting;

  async function submit(values: CreateNameFormValues) {
    try {
      await onSubmit(values.name);
      reset();
    } catch {
      // Mutation hooks expose the error state in the page.
    }
  }

  if (dividedFooter) {
    return (
      <form className="grid gap-4" noValidate onSubmit={handleSubmit(submit)}>
        <div>
          <TextInput
            aria-invalid={errors.name ? true : undefined}
            disabled={isDisabled}
            placeholder={placeholder}
            {...register("name")}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div className="flex justify-end border-t border-border pt-4">
          <Button disabled={isDisabled} type="submit">
            Criar
          </Button>
        </div>
      </form>
    );
  }

  return (
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
  );
}
