import { Button } from "@components/Button";
import { FieldError } from "@components/FieldError";
import { SelectInput, TextInput } from "@components/FormControls";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { MemberFormValues, MemberTargetOption } from "./types";

const emailSchema = z.string().email();

type MemberFormFields = {
  role: string;
  target: string;
};

function createMemberFormSchema(
  roles: readonly string[],
  targetOptions: readonly MemberTargetOption[] | undefined,
) {
  const targetValues = targetOptions?.map((option) => option.value) ?? [];

  return z.object({
    role: z
      .string()
      .min(1, "Selecione uma role.")
      .refine((role) => roles.includes(role), "Role invalida."),
    target: targetOptions
      ? z
          .string()
          .trim()
          .min(1, "Selecione um usuario.")
          .refine((value) => targetValues.includes(value), "Usuario invalido.")
      : z
          .string()
          .trim()
          .min(1, "Informe um email.")
          .refine((value) => emailSchema.safeParse(value).success, "Informe um email valido."),
  });
}

type MemberFormProps = {
  disabled: boolean;
  isPending: boolean;
  onSubmit: (values: MemberFormValues) => Promise<unknown>;
  roles: readonly string[];
  targetOptions?: readonly MemberTargetOption[];
  targetPlaceholder?: string;
};

export function MemberForm({
  disabled,
  isPending,
  onSubmit,
  roles,
  targetOptions,
  targetPlaceholder,
}: MemberFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<MemberFormFields>({
    defaultValues: {
      role: roles[0] ?? "",
      target: "",
    },
    resolver: zodResolver(createMemberFormSchema(roles, targetOptions)),
  });

  useEffect(() => {
    setValue("role", roles[0] ?? "");
  }, [roles, setValue]);

  const hasTargetOptions = targetOptions !== undefined;
  const isDisabled =
    disabled || isPending || isSubmitting || (hasTargetOptions && targetOptions.length === 0);

  async function submit(values: MemberFormFields) {
    const target = values.target.trim();
    const role = values.role.trim();

    try {
      await onSubmit(hasTargetOptions ? { role, userId: target } : { email: target, role });
      reset({
        role: roles[0] ?? "",
        target: "",
      });
    } catch {
      // Mutation hooks expose the error state in the page.
    }
  }

  return (
    <form
      className="grid gap-3 lg:grid-cols-[1.4fr_1fr_auto]"
      noValidate
      onSubmit={handleSubmit(submit)}
    >
      <div className="grid gap-2">
        {hasTargetOptions ? (
          <SelectInput
            aria-invalid={errors.target ? true : undefined}
            disabled={isDisabled}
            {...register("target")}
          >
            <option value="">{targetPlaceholder ?? "Selecione um usuario"}</option>
            {targetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {formatTargetOption(option)}
              </option>
            ))}
          </SelectInput>
        ) : (
          <TextInput
            aria-invalid={errors.target ? true : undefined}
            disabled={isDisabled}
            placeholder={targetPlaceholder ?? "email do usuario"}
            type="email"
            {...register("target")}
          />
        )}
        <FieldError>{errors.target?.message}</FieldError>
      </div>
      <div className="grid gap-2">
        <SelectInput
          aria-invalid={errors.role ? true : undefined}
          disabled={isDisabled}
          {...register("role")}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </SelectInput>
        <FieldError>{errors.role?.message}</FieldError>
      </div>
      <Button className="self-start justify-self-start" disabled={isDisabled} type="submit">
        {isPending ? "Salvando..." : "Adicionar"}
      </Button>
    </form>
  );
}

function formatTargetOption(option: MemberTargetOption) {
  return option.description ? `${option.label} - ${option.description}` : option.label;
}
