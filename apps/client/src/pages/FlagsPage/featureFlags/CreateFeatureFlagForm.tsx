import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { Button, FieldError, SelectInput, TextInput, TextareaInput } from "../../../components";
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
  const formId = useId();
  const keyId = `${formId}-key`;
  const nameId = `${formId}-name`;
  const typeId = `${formId}-type`;
  const descriptionId = `${formId}-description`;
  const tagsId = `${formId}-tags`;
  const hintId = `${formId}-hint`;
  const ownerId = `${formId}-owner`;
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
    <form className="grid gap-6" noValidate onSubmit={handleSubmit(submit)}>
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold text-foreground">Identidade</h3>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem]">
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
          <FormField error={errors.name?.message} label="Nome" required htmlFor={nameId}>
            <TextInput
              aria-invalid={errors.name ? true : undefined}
              disabled={isDisabled}
              id={nameId}
              placeholder="Novo checkout"
              {...register("name")}
            />
          </FormField>
          <FormField error={errors.type?.message} label="Tipo" required htmlFor={typeId}>
            <SelectInput
              aria-invalid={errors.type ? true : undefined}
              disabled={isDisabled}
              id={typeId}
              {...register("type")}
            >
              {featureFlagTypes.map((type) => (
                <option key={type} value={type}>
                  {formatFeatureFlagType(type)}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </section>

      <section className="grid gap-4">
        <h3 className="text-sm font-semibold text-foreground">Metadata opcional</h3>
        <FormField error={errors.description?.message} label="Descricao" htmlFor={descriptionId}>
          <TextareaInput
            aria-invalid={errors.description ? true : undefined}
            disabled={isDisabled}
            id={descriptionId}
            placeholder="Explique quando esta flag deve ser usada."
            rows={3}
            {...register("description")}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField error={errors.ownerUserId?.message} label="Owner" htmlFor={ownerId}>
            <SelectInput
              aria-invalid={errors.ownerUserId ? true : undefined}
              disabled={isDisabled}
              id={ownerId}
              {...register("ownerUserId")}
            >
              <option value="">Sem owner</option>
              {ownerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {formatOwnerOption(option)}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField error={errors.tags?.message} label="Tags" htmlFor={tagsId}>
            <TextInput
              aria-invalid={errors.tags ? true : undefined}
              disabled={isDisabled}
              id={tagsId}
              placeholder="checkout, beta"
              {...register("tags")}
            />
          </FormField>
        </div>
        <FormField error={errors.hint?.message} label="Hint para uso no SDK" htmlFor={hintId}>
          <TextInput
            aria-invalid={errors.hint ? true : undefined}
            disabled={isDisabled}
            id={hintId}
            placeholder="Ex: fallback seguro e false ate a liberacao."
            {...register("hint")}
          />
        </FormField>
      </section>

      <div className="flex justify-end border-t border-border pt-4">
        <Button disabled={isDisabled} type="submit">
          {isPending ? "Criando..." : "Criar flag"}
        </Button>
      </div>
    </form>
  );
}

type FormFieldProps = {
  children: ReactNode;
  error?: ReactNode;
  htmlFor: string;
  label: string;
  required?: boolean;
};

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

function formatFeatureFlagType(type: (typeof featureFlagTypes)[number]) {
  return type.replace("_", " ");
}

function formatOwnerOption(option: MemberTargetOption) {
  return option.description ? `${option.label} - ${option.description}` : option.label;
}
