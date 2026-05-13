import { apiBaseUrl } from "../api/client";
import { Shell } from "../components/Shell";

export function LoginPage() {
  return (
    <Shell title="Capture Flag">
      <section className="max-w-xl rounded-3xl border border-[#e3d8c7] bg-[#fffaf1] p-5 shadow-[0_24px_80px_rgb(23_32_51_/_8%)]">
        <span className="block text-sm font-black uppercase tracking-[0.08em] text-stone-600">
          Fase 1
        </span>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          Fundacao da plataforma
        </h2>
        <p className="mt-3 text-slate-700">
          Entre com GitHub para criar organizacoes, projetos, configs, ambientes e SDK keys.
        </p>
        <a
          className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-3 font-bold text-white no-underline transition hover:bg-slate-800"
          href={`${apiBaseUrl}/auth/github/start`}
        >
          Entrar com GitHub
        </a>
      </section>
    </Shell>
  );
}
