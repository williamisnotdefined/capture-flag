import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../Button";
import { FieldError } from "../FieldError";
import { SelectInput, TextInput } from "../FormControls";
import type { MemberFormValues } from "./types";

const emailSchema = z.string().email();
const uuidSchema = z.string().uuid();

type MemberFormFields = {
  role: string;
  target: string;
};

function createMemberFormSchema(roles: readonly string[]) {
  return z.object({
    role: z
      .string()
      .min(1, "Selecione uma role.")
      .refine((role) => roles.includes(role), "Role invalida."),
    target: z
      .string()
      .refine((value) => value.trim().length > 0, "Informe email ou user id.")
      .refine((value) => {
        const target = value.trim();
        return emailSchema.safeParse(target).success || uuidSchema.safeParse(target).success;
      }, "Informe um email ou UUID valido."),
  });
}

type MemberFormProps = {
  disabled: boolean;
  isPending: boolean;
  onSubmit: (values: MemberFormValues) => Promise<unknown>;
  roles: readonly string[];
};

export function MemberForm({ disabled, isPending, onSubmit, roles }: MemberFormProps) {
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
    resolver: zodResolver(createMemberFormSchema(roles)),
  });

  useEffect(() => {
    setValue("role", roles[0] ?? "");
  }, [roles, setValue]);

  const isDisabled = disabled || isPending || isSubmitting;

  async function submit(values: MemberFormFields) {
    const target = values.target.trim();
    const role = values.role.trim();

    try {
      await onSubmit(
        emailSchema.safeParse(target).success ? { email: target, role } : { userId: target, role },
      );
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
        <TextInput
          aria-invalid={errors.target ? true : undefined}
          disabled={isDisabled}
          placeholder="email ou user id"
          {...register("target")}
        />
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
      <Button className="self-start" disabled={isDisabled} type="submit">
        {isPending ? "Salvando..." : "Adicionar"}
      </Button>
    </form>
  );
}
