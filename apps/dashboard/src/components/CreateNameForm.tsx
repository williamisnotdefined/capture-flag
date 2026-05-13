import type { FormEvent } from "react";

type CreateNameFormProps = {
  disabled?: boolean;
  onSubmit: (name: string) => void;
  placeholder: string;
};

export function CreateNameForm({ disabled = false, onSubmit, placeholder }: CreateNameFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();

    if (!name) {
      return;
    }

    onSubmit(name);
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <input
        className="rounded-xl border border-[#cec6b8] bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-55"
        disabled={disabled}
        name="name"
        placeholder={placeholder}
      />
      <button
        className="rounded-xl bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55"
        disabled={disabled}
        type="submit"
      >
        Criar
      </button>
    </form>
  );
}
