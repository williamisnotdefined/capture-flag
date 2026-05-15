import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Eyebrow, FieldError, TextInput } from "../../../components";
import type { FeatureFlag } from "../../../types";
import { type UpdateFeatureFlagFormValues, updateFeatureFlagSchema } from "./schemas";

type FeatureFlagMetadataFormProps = {
  canEditMetadata: boolean;
  flag: FeatureFlag;
  isPending: boolean;
  onSubmit: (values: UpdateFeatureFlagFormValues) => Promise<unknown>;
};

export function FeatureFlagMetadataForm({
  canEditMetadata,
  flag,
  isPending,
  onSubmit,
}: FeatureFlagMetadataFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<UpdateFeatureFlagFormValues>({
    defaultValues: {
      key: "",
      name: "",
      description: "",
      hint: "",
      ownerUserId: "",
      tags: "",
    },
    resolver: zodResolver(updateFeatureFlagSchema),
  });

  useEffect(() => {
    reset({
      key: flag.key,
      name: flag.name,
      description: flag.description ?? "",
      hint: flag.hint ?? "",
      ownerUserId: flag.ownerUserId ?? "",
      tags: flag.tags.join(", "),
    });
  }, [flag, reset]);

  async function submit(values: UpdateFeatureFlagFormValues) {
    try {
      await onSubmit(values);
    } catch {
      // Mutation hooks expose the error state in the panel.
    }
  }

  const isDisabled = !canEditMetadata || isPending || isSubmitting;

  return (
    <form
      className="grid gap-3 border-b border-stone-300 pb-4"
      noValidate
      onSubmit={handleSubmit(submit)}
    >
      <div>
        <Eyebrow>Metadata</Eyebrow>
        <strong className="text-slate-900">{flag.key}</strong>
      </div>

      <div className="grid gap-2">
        <TextInput
          aria-invalid={errors.key ? true : undefined}
          disabled={isDisabled}
          placeholder="key"
          {...register("key")}
        />
        <FieldError>{errors.key?.message}</FieldError>
      </div>

      <div className="grid gap-2">
        <TextInput
          aria-invalid={errors.name ? true : undefined}
          disabled={isDisabled}
          placeholder="Nome da flag"
          {...register("name")}
        />
        <FieldError>{errors.name?.message}</FieldError>
      </div>

      <div className="grid gap-2">
        <TextInput
          aria-invalid={errors.description ? true : undefined}
          disabled={isDisabled}
          placeholder="Descricao opcional"
          {...register("description")}
        />
        <FieldError>{errors.description?.message}</FieldError>
      </div>

      <div className="grid gap-2">
        <TextInput
          aria-invalid={errors.tags ? true : undefined}
          disabled={isDisabled}
          placeholder="tags separadas por virgula"
          {...register("tags")}
        />
        <FieldError>{errors.tags?.message}</FieldError>
      </div>

      <div className="grid gap-2">
        <TextInput
          aria-invalid={errors.hint ? true : undefined}
          disabled={isDisabled}
          placeholder="Hint opcional"
          {...register("hint")}
        />
        <FieldError>{errors.hint?.message}</FieldError>
      </div>

      <div className="grid gap-2">
        <TextInput
          aria-invalid={errors.ownerUserId ? true : undefined}
          disabled={isDisabled}
          placeholder="Owner user id opcional"
          {...register("ownerUserId")}
        />
        <FieldError>{errors.ownerUserId?.message}</FieldError>
      </div>

      <Button className="self-start" disabled={isDisabled} type="submit" variant="secondary">
        {isPending ? "Salvando..." : "Salvar metadata"}
      </Button>
    </form>
  );
}
