import { zodResolver } from "@hookform/resolvers/zod";
import cls from "classnames";
import { Check, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FieldError } from "./FieldError";
import { TextInput } from "./FormControls";

const inlineNameFormSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Use ate 120 caracteres."),
});

type InlineNameFormValues = z.infer<typeof inlineNameFormSchema>;
type DisplayElement = "h1" | "span" | "strong";

type InlineNameEditorProps = {
  canEdit: boolean;
  disabled?: boolean;
  displayAs?: DisplayElement;
  displayClassName?: string;
  editLabel?: string;
  inputClassName?: string;
  inputLabel?: string;
  name: string;
  onSubmit: (name: string) => Promise<unknown> | unknown;
};

const iconButtonClassName =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export function InlineNameEditor({
  canEdit,
  disabled = false,
  displayAs = "strong",
  displayClassName,
  editLabel = "Editar nome",
  inputClassName,
  inputLabel = "Nome",
  name,
  onSubmit,
}: InlineNameEditorProps) {
  const DisplayComponent = displayAs;
  const [isEditing, setIsEditing] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<InlineNameFormValues>({
    defaultValues: {
      name,
    },
    resolver: zodResolver(inlineNameFormSchema),
  });

  useEffect(() => {
    reset({ name });
    setIsEditing(false);
  }, [name, reset]);

  const isDisabled = disabled || isSubmitting;
  const displayName = <DisplayComponent className={displayClassName}>{name}</DisplayComponent>;

  async function submit(values: InlineNameFormValues) {
    if (values.name === name) {
      reset({ name });
      setIsEditing(false);
      return;
    }

    try {
      await onSubmit(values.name);
      reset({ name: values.name });
      setIsEditing(false);
    } catch {
      // Mutation hooks expose the error state in the owning page.
    }
  }

  function cancelEditing() {
    reset({ name });
    setIsEditing(false);
  }

  if (!isEditing) {
    if (!canEdit) {
      return displayName;
    }

    return (
      <span className="inline-flex min-w-0 items-center gap-2">
        {displayName}
        <button
          aria-label={editLabel}
          className={iconButtonClassName}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            setIsEditing(true);
          }}
          type="button"
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
        </button>
      </span>
    );
  }

  return (
    <form
      className="flex flex-wrap items-start gap-2"
      noValidate
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onSubmit={handleSubmit(submit)}
    >
      <div className="min-w-0">
        <TextInput
          aria-invalid={errors.name ? true : undefined}
          aria-label={inputLabel}
          autoFocus
          className={cls("h-8", inputClassName)}
          disabled={isDisabled}
          {...register("name")}
        />
        <FieldError>{errors.name?.message}</FieldError>
      </div>
      <button
        aria-label="Salvar nome"
        className={iconButtonClassName}
        disabled={isDisabled}
        type="submit"
      >
        <Check aria-hidden="true" className="h-4 w-4" />
      </button>
      <button
        aria-label="Cancelar edicao"
        className={iconButtonClassName}
        disabled={isDisabled}
        onClick={cancelEditing}
        type="button"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </form>
  );
}
