import { apiV1BaseUrl } from "../api/client";
import { Shell } from "../components/Shell";

export function LoginPage() {
  return (
    <Shell title="Capture Flag">
      <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <span className="block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
          Fase 1
        </span>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
          Fundacao da plataforma
        </h2>
        <p className="mt-3 text-slate-700">
          Entre com GitHub para criar organizacoes, projetos, configs, ambientes e SDK keys.
        </p>
        <a
          className="mt-4 inline-flex h-9 items-center rounded-md border border-slate-900 bg-slate-900 px-3 text-sm font-medium text-white no-underline shadow-sm transition hover:bg-slate-800"
          href={`${apiV1BaseUrl}/auth/github/start`}
        >
          Entrar com GitHub
        </a>
      </section>
    </Shell>
  );
}
