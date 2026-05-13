import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createNameFormSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Use ate 120 caracteres."),
});

type CreateNameFormValues = z.infer<typeof createNameFormSchema>;

type CreateNameFormProps = {
  disabled?: boolean;
  onSubmit: (name: string) => Promise<unknown> | unknown;
  placeholder: string;
};

export function CreateNameForm({ disabled = false, onSubmit, placeholder }: CreateNameFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<CreateNameFormValues>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(createNameFormSchema),
  });

  const isDisabled = disabled || isSubmitting;

  async function submit(values: CreateNameFormValues) {
    try {
      await onSubmit(values.name);
      reset();
    } catch {
      // Mutation hooks expose the error state in the page.
    }
  }

  return (
    <form className="grid gap-3" noValidate onSubmit={handleSubmit(submit)}>
      <input
        aria-invalid={errors.name ? true : undefined}
        className="rounded-xl border border-[#cec6b8] bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-55"
        disabled={isDisabled}
        placeholder={placeholder}
        {...register("name")}
      />
      {errors.name?.message ? (
        <p className="text-sm font-semibold text-red-700">{errors.name.message}</p>
      ) : null}
      <button
        className="rounded-xl bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55"
        disabled={isDisabled}
        type="submit"
      >
        Criar
      </button>
    </form>
  );
}
