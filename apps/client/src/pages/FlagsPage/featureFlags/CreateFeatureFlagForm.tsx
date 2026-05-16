import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, FieldError, SelectInput, TextInput } from "../../../components";
import type { MemberTargetOption } from "../../../components";
import {
  type CreateFeatureFlagFormValues,
  createFeatureFlagSchema,
  featureFlagTypes,
} from "./schemas";

type CreateFeatureFlagFormProps = {
  canCreateFlag: boolean;
  isPending: boolean;
  onSubmit: (values: CreateFeatureFlagFormValues) => Promise<unknown>;
  ownerOptions: readonly MemberTargetOption[];
};

export function CreateFeatureFlagForm({
  canCreateFlag,
  isPending,
  onSubmit,
  ownerOptions,
}: CreateFeatureFlagFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<CreateFeatureFlagFormValues>({
    defaultValues: {
      key: "",
      name: "",
      type: "boolean",
      description: "",
      hint: "",
      ownerUserId: "",
      tags: "",
    },
    resolver: zodResolver(createFeatureFlagSchema),
  });

  async function submit(values: CreateFeatureFlagFormValues) {
    try {
      await onSubmit(values);
      reset();
    } catch {
      // Mutation hooks expose the error state in the panel.
    }
  }

  const isDisabled = !canCreateFlag || isPending || isSubmitting;

  return (
    <form className="grid gap-3 lg:grid-cols-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="grid gap-2">
        <TextInput
          aria-invalid={errors.key ? true : undefined}
          disabled={isDisabled}
          placeholder="newCheckout"
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
      <SelectInput
        aria-invalid={errors.type ? true : undefined}
        disabled={isDisabled}
        {...register("type")}
      >
        {featureFlagTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </SelectInput>
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
        <SelectInput
          aria-invalid={errors.ownerUserId ? true : undefined}
          disabled={isDisabled}
          {...register("ownerUserId")}
        >
          <option value="">Sem owner</option>
          {ownerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {formatOwnerOption(option)}
            </option>
          ))}
        </SelectInput>
        <FieldError>{errors.ownerUserId?.message}</FieldError>
      </div>
      <Button className="self-start" disabled={isDisabled} type="submit">
        {isPending ? "Criando..." : "Criar flag"}
      </Button>
    </form>
  );
}

function formatOwnerOption(option: MemberTargetOption) {
  return option.description ? `${option.label} - ${option.description}` : option.label;
}
