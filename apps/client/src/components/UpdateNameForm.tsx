import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./Button";
import { FieldError } from "./FieldError";
import { TextInput } from "./FormControls";

const updateNameFormSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Use ate 120 caracteres."),
});

type UpdateNameFormValues = z.infer<typeof updateNameFormSchema>;

type UpdateNameFormProps = {
  disabled?: boolean;
  name: string;
  onSubmit: (name: string) => Promise<unknown> | unknown;
};

export function UpdateNameForm({ disabled = false, name, onSubmit }: UpdateNameFormProps) {
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<UpdateNameFormValues>({
    defaultValues: {
      name,
    },
    resolver: zodResolver(updateNameFormSchema),
  });

  useEffect(() => {
    reset({ name });
  }, [name, reset]);

  const isDisabled = disabled || isSubmitting;

  async function submit(values: UpdateNameFormValues) {
    try {
      await onSubmit(values.name);
      reset({ name: values.name });
    } catch {
      // Mutation hooks expose the error state in the page.
    }
  }

  return (
    <form
      className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
      noValidate
      onSubmit={handleSubmit(submit)}
    >
      <div>
        <TextInput
          aria-invalid={errors.name ? true : undefined}
          disabled={isDisabled}
          {...register("name")}
        />
        <FieldError>{errors.name?.message}</FieldError>
      </div>
      <Button className="justify-self-start" disabled={isDisabled || !isDirty} type="submit">
        Salvar nome
      </Button>
    </form>
  );
}
