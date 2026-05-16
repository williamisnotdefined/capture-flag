import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./Button";
import { FieldError } from "./FieldError";
import { TextInput, TextareaInput } from "./FormControls";

const createConfigFormSchema = z.object({
  description: z.string().max(500, "Use ate 500 caracteres."),
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Use ate 120 caracteres."),
});

type CreateConfigFormValues = z.infer<typeof createConfigFormSchema>;

export type CreateConfigFormSubmitValues = {
  description?: string;
  name: string;
};

type CreateConfigFormProps = {
  disabled?: boolean;
  dividedFooter?: boolean;
  onSubmit: (values: CreateConfigFormSubmitValues) => Promise<unknown> | unknown;
};

export function CreateConfigForm({
  disabled = false,
  dividedFooter = false,
  onSubmit,
}: CreateConfigFormProps) {
  const nameId = useId();
  const descriptionId = useId();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<CreateConfigFormValues>({
    defaultValues: {
      description: "",
      name: "",
    },
    resolver: zodResolver(createConfigFormSchema),
  });
  const isDisabled = disabled || isSubmitting;

  async function submit(values: CreateConfigFormValues) {
    const description = values.description.trim();

    try {
      await onSubmit({
        ...(description ? { description } : {}),
        name: values.name,
      });
      reset();
    } catch {
      // Mutation hooks expose the error state in the owning dialog.
    }
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor={nameId}>
          Nome
        </label>
        <TextInput
          aria-invalid={errors.name ? true : undefined}
          autoFocus
          disabled={isDisabled}
          id={nameId}
          placeholder="Nova config"
          {...register("name")}
        />
        <FieldError>{errors.name?.message}</FieldError>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor={descriptionId}>
          Descricao
        </label>
        <TextareaInput
          aria-invalid={errors.description ? true : undefined}
          disabled={isDisabled}
          id={descriptionId}
          placeholder="Ex.: Config consumida pelo SDK web."
          {...register("description")}
        />
        <FieldError>{errors.description?.message}</FieldError>
      </div>
      <div
        className={
          dividedFooter ? "flex justify-end border-t border-border pt-4" : "flex justify-end"
        }
      >
        <Button disabled={isDisabled} type="submit">
          Criar
        </Button>
      </div>
    </form>
  );
}
