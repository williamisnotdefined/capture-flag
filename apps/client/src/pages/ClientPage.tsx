import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGetMe, useLogout } from "../api/auth";
import { useCreateConfig, useGetProjectConfigs } from "../api/configs";
import { useCreateEnvironment, useGetProjectEnvironments } from "../api/environments";
import { useCreateOrganization } from "../api/organizations";
import { useCreateProject, useGetProjects } from "../api/projects";
import { useCreateSdkKey, useGetProjectSdkKeys } from "../api/sdkKeys";
import { CreateNameForm } from "../components/CreateNameForm";
import { ItemList } from "../components/ItemList";
import { Panel } from "../components/Panel";
import { Shell } from "../components/Shell";

const fieldClassName =
  "rounded-xl border border-[#cec6b8] bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-55";
const primaryButtonClassName =
  "rounded-xl bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55";

export function ClientPage() {
  const navigate = useNavigate();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [createdSdkKey, setCreatedSdkKey] = useState<string>("");

  const meQuery = useGetMe();
  const organizations = meQuery.data?.organizations ?? [];

  useEffect(() => {
    if (!selectedOrganizationId && organizations.length > 0) {
      setSelectedOrganizationId(organizations[0].id);
    }
  }, [organizations, selectedOrganizationId]);

  const projectsQuery = useGetProjects(selectedOrganizationId);
  const projects = projectsQuery.data ?? [];

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const configsQuery = useGetProjectConfigs(selectedProjectId);
  const environmentsQuery = useGetProjectEnvironments(selectedProjectId);
  const sdkKeysQuery = useGetProjectSdkKeys(selectedProjectId);

  const createOrganizationMutation = useCreateOrganization({
    onSuccess: (organization) => {
      setSelectedOrganizationId(organization.id);
      setSelectedProjectId("");
    },
  });

  const createProjectMutation = useCreateProject({
    organizationId: selectedOrganizationId,
    onSuccess: (project) => {
      setSelectedProjectId(project.id);
    },
  });

  const createConfigMutation = useCreateConfig({
    projectId: selectedProjectId,
  });

  const createEnvironmentMutation = useCreateEnvironment({
    projectId: selectedProjectId,
  });

  const createSdkKeyMutation = useCreateSdkKey({
    projectId: selectedProjectId,
    onSuccess: (sdkKey) => {
      setCreatedSdkKey(sdkKey.key ?? "");
    },
  });

  const logoutMutation = useLogout({
    onSuccess: () => {
      setSelectedOrganizationId("");
      setSelectedProjectId("");
      navigate("/login");
    },
  });

  function handleCreateSdkKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createSdkKeyMutation.mutate({
      configId: String(data.get("configId") ?? ""),
      environmentId: String(data.get("environmentId") ?? ""),
      name: String(data.get("name") ?? ""),
    });
    event.currentTarget.reset();
  }

  if (meQuery.isLoading) {
    return <Shell title="Capture Flag">Carregando sessao...</Shell>;
  }

  if (meQuery.isError) {
    return <Navigate to="/login" replace />;
  }

  const me = meQuery.data;
  if (!me) {
    return <Shell title="Capture Flag">Sessao indisponivel.</Shell>;
  }

  const configs = configsQuery.data ?? [];
  const environments = environmentsQuery.data ?? [];
  const sdkKeys = sdkKeysQuery.data ?? [];

  return (
    <Shell title="Capture Flag">
      <header className="mb-4 flex flex-col justify-between gap-4 rounded-3xl border border-[#e3d8c7] bg-[#fffaf1] p-4 sm:flex-row sm:items-center">
        <div>
          <span className="block text-sm font-black uppercase tracking-[0.08em] text-stone-600">
            Sessao
          </span>
          <strong className="text-slate-900">{me.user.name}</strong>
        </div>
        <button
          className={primaryButtonClassName}
          onClick={() => logoutMutation.mutate()}
          type="button"
        >
          Sair
        </button>
      </header>

      <main className="grid gap-4 lg:grid-cols-2">
        <Panel title="Organizacoes">
          <CreateNameForm
            onSubmit={createOrganizationMutation.mutate}
            placeholder="Nova organizacao"
          />
          <select
            className={`${fieldClassName} mt-3 w-full`}
            onChange={(event) => {
              setSelectedOrganizationId(event.target.value);
              setSelectedProjectId("");
            }}
            value={selectedOrganizationId}
          >
            <option value="">Selecione</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name} ({organization.role})
              </option>
            ))}
          </select>
        </Panel>

        <Panel title="Projetos">
          <CreateNameForm
            disabled={!selectedOrganizationId}
            onSubmit={createProjectMutation.mutate}
            placeholder="Novo projeto"
          />
          <select
            className={`${fieldClassName} mt-3 w-full`}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            value={selectedProjectId}
          >
            <option value="">Selecione</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {projectsQuery.isFetching ? (
            <p className="mt-4 text-sm text-stone-600">Atualizando projetos...</p>
          ) : null}
        </Panel>

        <Panel title="Configs">
          <CreateNameForm
            disabled={!selectedProjectId}
            onSubmit={createConfigMutation.mutate}
            placeholder="Nova config"
          />
          <ItemList
            empty="Sem configs"
            items={configs.map((config) => `${config.name} (${config.key})`)}
          />
        </Panel>

        <Panel title="Ambientes">
          <CreateNameForm
            disabled={!selectedProjectId}
            onSubmit={createEnvironmentMutation.mutate}
            placeholder="production"
          />
          <ItemList
            empty="Sem ambientes"
            items={environments.map((environment) => `${environment.name} (${environment.key})`)}
          />
        </Panel>

        <Panel title="SDK Keys" wide>
          <form
            className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_auto]"
            onSubmit={handleCreateSdkKey}
          >
            <input
              className={fieldClassName}
              disabled={!selectedProjectId}
              name="name"
              placeholder="Nome da SDK key"
            />
            <select
              className={fieldClassName}
              disabled={configs.length === 0}
              name="configId"
              required
            >
              <option value="">Config</option>
              {configs.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name}
                </option>
              ))}
            </select>
            <select
              className={fieldClassName}
              disabled={environments.length === 0}
              name="environmentId"
              required
            >
              <option value="">Environment</option>
              {environments.map((environment) => (
                <option key={environment.id} value={environment.id}>
                  {environment.name}
                </option>
              ))}
            </select>
            <button
              className={primaryButtonClassName}
              disabled={!selectedProjectId || configs.length === 0 || environments.length === 0}
              type="submit"
            >
              Gerar key
            </button>
          </form>

          {createdSdkKey ? (
            <div className="mt-4 grid gap-3 rounded-2xl bg-slate-900 p-4 text-white">
              <span>Copie agora. A chave completa nao sera exibida novamente.</span>
              <code className="break-all">{createdSdkKey}</code>
            </div>
          ) : null}

          <div className="mt-4 grid gap-3">
            {sdkKeys.map((sdkKey) => (
              <div
                className="grid items-center gap-2 rounded-2xl bg-[#f4f0e8] p-4 text-sm text-slate-800 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
                key={sdkKey.id}
              >
                <strong className="text-slate-900">{sdkKey.name}</strong>
                <span>{sdkKey.keyPrefix}...</span>
                <span>
                  {sdkKey.config.name} / {sdkKey.environment.name}
                </span>
                <span>{sdkKey.revokedAt ? "revogada" : "ativa"}</span>
              </div>
            ))}
            {sdkKeys.length === 0 && !sdkKeysQuery.isFetching ? (
              <p className="text-sm text-stone-600">Sem SDK keys</p>
            ) : null}
          </div>
        </Panel>
      </main>
    </Shell>
  );
}
