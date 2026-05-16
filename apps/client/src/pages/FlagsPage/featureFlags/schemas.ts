import { z } from "zod";
import { parseCommaSeparatedUniqueValues } from "../../../core/strings/parseCommaSeparatedUniqueValues";

export const featureFlagTypes = [
  "boolean",
  "string",
  "integer",
  "double",
  "json_object",
  "json_array",
] as const;

const uuidSchema = z.string().uuid();
const optionalUuidSchema = z
  .string()
  .trim()
  .refine((value) => !value || uuidSchema.safeParse(value).success, "Informe um UUID valido.");

export const createFeatureFlagSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Informe uma key.")
    .max(80, "Use ate 80 caracteres.")
    .regex(
      /^[A-Za-z][A-Za-z0-9_.-]*$/,
      "Use letras, numeros, ponto, underline ou hifen. Comece com letra.",
    ),
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Use ate 120 caracteres."),
  type: z.enum(featureFlagTypes),
  description: z.string().max(500, "Use ate 500 caracteres."),
  hint: z.string().max(500, "Use ate 500 caracteres."),
  ownerUserId: optionalUuidSchema,
  tags: z
    .string()
    .max(1000, "Use ate 1000 caracteres.")
    .refine(
      (value) => parseCommaSeparatedUniqueValues(value).length <= 20,
      "Use no maximo 20 tags.",
    )
    .refine(
      (value) => parseCommaSeparatedUniqueValues(value).every((tag) => tag.length <= 50),
      "Cada tag deve ter ate 50 caracteres.",
    ),
});

export const updateFeatureFlagSchema = createFeatureFlagSchema.omit({ type: true });

export const valueFormSchema = z.object({
  defaultValue: z.string(),
  percentageAttribute: z
    .string()
    .trim()
    .min(1, "Informe um atributo.")
    .max(80, "Use ate 80 caracteres."),
  percentageOptionsJson: z.string(),
  rulesJson: z.string(),
});

export type CreateFeatureFlagFormValues = z.infer<typeof createFeatureFlagSchema>;
export type UpdateFeatureFlagFormValues = z.infer<typeof updateFeatureFlagSchema>;
export type ValueFormValues = z.infer<typeof valueFormSchema>;
