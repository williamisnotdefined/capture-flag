import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  ErrorMessage,
  Eyebrow,
  FieldError,
  SelectInput,
  TextInput,
  TextareaInput,
} from "../../../../components";
import type { FeatureFlag, FeatureFlagEnvironmentValue } from "../../../../types";
import { type ValueFormValues, valueFormSchema } from "./schemas";
import {
  defaultValueForType,
  jsonArrayToInput,
  parseDefaultValue,
  parseJsonArray,
  parsePercentageOptions,
  valueToInput,
} from "./utils";

type ParsedValueFormValues = {
  defaultValue: unknown;
  percentageAttribute: string;
  percentageOptionsJson: unknown[];
  rulesJson: unknown[];
};

type FeatureFlagValueFormProps = {
  canEditValue: boolean;
  environmentId: string;
  environmentName?: string;
  flag: FeatureFlag;
  isPending: boolean;
  mutationError: unknown;
  onSubmit: (values: ParsedValueFormValues) => Promise<unknown>;
  value: FeatureFlagEnvironmentValue | undefined;
};

export function FeatureFlagValueForm({
  canEditValue,
  environmentId,
  environmentName,
  flag,
  isPending,
  mutationError,
  onSubmit,
  value,
}: FeatureFlagValueFormProps) {
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<ValueFormValues>({
    defaultValues: {
      defaultValue: "",
      percentageAttribute: "identifier",
      percentageOptionsJson: "[]",
      rulesJson: "[]",
    },
    resolver: zodResolver(valueFormSchema),
  });

  useEffect(() => {
    reset({
      defaultValue: valueToInput(flag, value?.defaultValue),
      percentageAttribute: value?.percentageAttribute ?? "identifier",
      percentageOptionsJson: jsonArrayToInput(value?.percentageOptionsJson),
      rulesJson: jsonArrayToInput(value?.rulesJson),
    });
  }, [flag, reset, value]);

  async function submit(values: ValueFormValues) {
    clearErrors(["defaultValue", "rulesJson", "percentageOptionsJson"]);

    let defaultValue: unknown;
    let rulesJson: unknown[];
    let percentageOptionsJson: unknown[];

    try {
      defaultValue = parseDefaultValue(flag.type, values.defaultValue);
    } catch (error) {
      setError("defaultValue", {
        message: error instanceof Error ? error.message : "Valor invalido.",
      });
      return;
    }

    try {
      rulesJson = parseJsonArray(values.rulesJson, "Rules");
    } catch (error) {
      setError("rulesJson", {
        message: error instanceof Error ? error.message : "Rules invalidas.",
      });
      return;
    }

    try {
      percentageOptionsJson = parsePercentageOptions(values.percentageOptionsJson, flag.type);
    } catch (error) {
      setError("percentageOptionsJson", {
        message: error instanceof Error ? error.message : "Rollout percentual invalido.",
      });
      return;
    }

    try {
      await onSubmit({
        defaultValue,
        percentageAttribute: values.percentageAttribute.trim(),
        percentageOptionsJson,
        rulesJson,
      });
    } catch {
      // Mutation hooks expose the error state in the section.
    }
  }

  const isDisabled = !canEditValue || isPending || isSubmitting;

  return (
    <form className="grid gap-3" noValidate onSubmit={handleSubmit(submit)}>
      <div>
        <Eyebrow>Valor em {environmentName ?? "ambiente"}</Eyebrow>
        <strong className="text-slate-900">{flag.key}</strong>
      </div>

      <div className="grid gap-2">
        {flag.type === "boolean" ? (
          <SelectInput
            aria-invalid={errors.defaultValue ? true : undefined}
            disabled={isDisabled}
            {...register("defaultValue")}
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </SelectInput>
        ) : (
          <TextInput
            aria-invalid={errors.defaultValue ? true : undefined}
            disabled={isDisabled}
            placeholder={defaultValueForType(flag.type)}
            step={flag.type === "integer" ? "1" : "any"}
            type={flag.type === "string" ? "text" : "number"}
            {...register("defaultValue")}
          />
        )}
        <FieldError>{errors.defaultValue?.message}</FieldError>
      </div>

      <div className="grid gap-2">
        <label
          className="text-sm font-black uppercase tracking-[0.08em] text-stone-600"
          htmlFor="feature-flag-rules-json"
        >
          Rules JSON
        </label>
        <TextareaInput
          aria-invalid={errors.rulesJson ? true : undefined}
          className="min-h-28 font-mono text-sm"
          disabled={isDisabled}
          id="feature-flag-rules-json"
          placeholder="[]"
          {...register("rulesJson")}
        />
        <FieldError>{errors.rulesJson?.message}</FieldError>
      </div>

      <div className="grid gap-2">
        <label
          className="text-sm font-black uppercase tracking-[0.08em] text-stone-600"
          htmlFor="feature-flag-percentage-attribute"
        >
          Atributo de rollout
        </label>
        <TextInput
          aria-invalid={errors.percentageAttribute ? true : undefined}
          disabled={isDisabled}
          id="feature-flag-percentage-attribute"
          placeholder="identifier"
          {...register("percentageAttribute")}
        />
        <FieldError>{errors.percentageAttribute?.message}</FieldError>
      </div>

      <div className="grid gap-2">
        <label
          className="text-sm font-black uppercase tracking-[0.08em] text-stone-600"
          htmlFor="feature-flag-percentage-options-json"
        >
          Rollout percentual JSON
        </label>
        <TextareaInput
          aria-invalid={errors.percentageOptionsJson ? true : undefined}
          className="min-h-28 font-mono text-sm"
          disabled={isDisabled}
          id="feature-flag-percentage-options-json"
          placeholder="[]"
          {...register("percentageOptionsJson")}
        />
        <FieldError>{errors.percentageOptionsJson?.message}</FieldError>
      </div>

      {!environmentId ? (
        <p className="text-sm text-stone-600">Selecione um ambiente para editar o valor.</p>
      ) : null}
      <ErrorMessage error={mutationError} />

      <Button className="self-start" disabled={isDisabled} type="submit" variant="secondary">
        {isPending ? "Salvando..." : "Salvar valor"}
      </Button>
    </form>
  );
}
