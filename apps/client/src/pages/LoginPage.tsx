import { apiV1BaseUrl } from "@api/client";
import { Shell } from "@components/Shell";

export function LoginPage() {
  return (
    <Shell title="Capture Flag">
      <section className="max-w-xl rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <span className="block text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Fase 1
        </span>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          Fundacao da plataforma
        </h2>
        <p className="mt-3 text-muted-foreground">
          Entre com GitHub para criar organizacoes, projetos, configs, ambientes e SDK keys.
        </p>
        <a
          className="mt-4 inline-flex h-9 items-center rounded-md border border-transparent bg-primary px-3 text-sm font-medium text-primary-foreground no-underline shadow-sm transition hover:bg-primary/90"
          href={`${apiV1BaseUrl}/auth/github/start`}
        >
          Entrar com GitHub
        </a>
      </section>
    </Shell>
  );
}
