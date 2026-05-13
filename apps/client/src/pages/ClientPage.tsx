import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useGetMe, useLogout } from "../api/auth";
import { apiBaseUrl } from "../api/client";
import { useCreateConfig, useGetProjectConfigs } from "../api/configs";
import { useCreateEnvironment, useGetProjectEnvironments } from "../api/environments";
import {
  useAddOrganizationMember,
  useCreateOrganization,
  useGetOrganizationMembers,
} from "../api/organizations";
import {
  useAddProjectMember,
  useCreateProject,
  useGetProjectMembers,
  useGetProjects,
} from "../api/projects";
import { useCreateSdkKey, useGetProjectSdkKeys } from "../api/sdkKeys";
import { CreateNameForm } from "../components/CreateNameForm";
import { FeatureFlagsPanel } from "../components/FeatureFlagsPanel";
import { ItemList } from "../components/ItemList";
import { Panel } from "../components/Panel";
import { Shell } from "../components/Shell";
import type { OrganizationMember, ProjectMember } from "../types";

const fieldClassName =
  "rounded-xl border border-[#cec6b8] bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-55";
const primaryButtonClassName =
  "rounded-xl bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55";
const secondaryButtonClassName =
  "rounded-xl border border-slate-300 bg-white/80 px-4 py-3 font-bold text-slate-900 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-55";

const ownerOrganizationRoles = ["owner", "admin", "member", "viewer"];
const adminOrganizationRoles = ["admin", "member", "viewer"];
const projectRoles = ["project_admin", "developer", "viewer"];
const emailSchema = z.string().email();
const uuidSchema = z.string().uuid();
const sdkKeyFormSchema = z.object({
  name: z.string().max(120, "Use ate 120 caracteres."),
});

type MemberFormValues = {
  email?: string;
  userId?: string;
  role: string;
};

type MemberFormFields = {
  role: string;
  target: string;
};

type SdkKeyFormValues = z.infer<typeof sdkKeyFormSchema>;

type CreatedSdkKeyState = {
  configId: string;
  environmentId: string;
  key: string;
  projectId: string;
};

function createMemberFormSchema(roles: string[]) {
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro inesperado";
}

function ErrorMessage({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }

  return <p className="mt-3 text-sm font-semibold text-red-700">{getErrorMessage(error)}</p>;
}

function PermissionHint({ children }: { children: string }) {
  return <p className="mt-3 text-sm text-stone-600">{children}</p>;
}

function MemberForm({
  disabled,
  isPending,
  onSubmit,
  roles,
}: {
  disabled: boolean;
  isPending: boolean;
  onSubmit: (values: MemberFormValues) => Promise<unknown>;
  roles: string[];
}) {
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
        <input
          aria-invalid={errors.target ? true : undefined}
          className={fieldClassName}
          disabled={isDisabled}
          placeholder="email ou user id"
          {...register("target")}
        />
        {errors.target?.message ? (
          <p className="text-sm font-semibold text-red-700">{errors.target.message}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <select
          aria-invalid={errors.role ? true : undefined}
          className={fieldClassName}
          disabled={isDisabled}
          {...register("role")}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {errors.role?.message ? (
          <p className="text-sm font-semibold text-red-700">{errors.role.message}</p>
        ) : null}
      </div>
      <button
        className={`${primaryButtonClassName} self-start`}
        disabled={isDisabled}
        type="submit"
      >
        {isPending ? "Salvando..." : "Adicionar"}
      </button>
    </form>
  );
}

function OrganizationMemberList({ members }: { members: OrganizationMember[] }) {
  if (members.length === 0) {
    return <p className="mt-4 text-sm text-stone-600">Sem membros</p>;
  }

  return (
    <div className="mt-4 grid gap-3">
      {members.map((member) => (
        <div className="rounded-2xl bg-[#f4f0e8] p-4 text-sm text-slate-800" key={member.id}>
          <strong className="block text-slate-900">{member.user.name}</strong>
          <span className="block">{member.user.email ?? member.user.id}</span>
          <span className="block font-semibold">{member.role}</span>
        </div>
      ))}
    </div>
  );
}

function ProjectMemberList({ members }: { members: ProjectMember[] }) {
  if (members.length === 0) {
    return <p className="mt-4 text-sm text-stone-600">Sem membros no projeto</p>;
  }

  return (
    <div className="mt-4 grid gap-3">
      {members.map((member) => (
        <div className="rounded-2xl bg-[#f4f0e8] p-4 text-sm text-slate-800" key={member.id}>
          <strong className="block text-slate-900">{member.user.name}</strong>
          <span className="block">{member.user.email ?? member.user.id}</span>
          <span className="block font-semibold">{member.role}</span>
        </div>
      ))}
    </div>
  );
}

export function ClientPage() {
  const navigate = useNavigate();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>("");
  const [createdSdkKey, setCreatedSdkKey] = useState<CreatedSdkKeyState | null>(null);
  const [copyMessage, setCopyMessage] = useState<string>("");

  const meQuery = useGetMe();
  const organizations = meQuery.data?.organizations ?? [];

  useEffect(() => {
    const nextOrganizationId = organizations.some(
      (organization) => organization.id === selectedOrganizationId,
    )
      ? selectedOrganizationId
      : (organizations[0]?.id ?? "");

    if (selectedOrganizationId !== nextOrganizationId) {
      setSelectedOrganizationId(nextOrganizationId);
      setSelectedProjectId("");
      setSelectedConfigId("");
      setSelectedEnvironmentId("");
      setCreatedSdkKey(null);
      setCopyMessage("");
    }
  }, [organizations, selectedOrganizationId]);

  const projectsQuery = useGetProjects(selectedOrganizationId);
  const projects = projectsQuery.data ?? [];

  useEffect(() => {
    const nextProjectId = projects.some((project) => project.id === selectedProjectId)
      ? selectedProjectId
      : (projects[0]?.id ?? "");

    if (selectedProjectId !== nextProjectId) {
      setSelectedProjectId(nextProjectId);
      setSelectedConfigId("");
      setSelectedEnvironmentId("");
      setCreatedSdkKey(null);
      setCopyMessage("");
    }
  }, [projects, selectedProjectId]);

  const configsQuery = useGetProjectConfigs(selectedProjectId);
  const environmentsQuery = useGetProjectEnvironments(selectedProjectId);
  const sdkKeysQuery = useGetProjectSdkKeys(selectedProjectId);
  const organizationMembersQuery = useGetOrganizationMembers(selectedOrganizationId);
  const projectMembersQuery = useGetProjectMembers(selectedProjectId);

  const configs = configsQuery.data ?? [];
  const environments = environmentsQuery.data ?? [];
  const sdkKeys = sdkKeysQuery.data ?? [];
  const organizationMembers = organizationMembersQuery.data ?? [];
  const projectMembers = projectMembersQuery.data ?? [];

  useEffect(() => {
    const nextConfigId = configs.some((config) => config.id === selectedConfigId)
      ? selectedConfigId
      : (configs[0]?.id ?? "");

    if (selectedConfigId !== nextConfigId) {
      setSelectedConfigId(nextConfigId);
    }
  }, [configs, selectedConfigId]);

  useEffect(() => {
    const nextEnvironmentId = environments.some(
      (environment) => environment.id === selectedEnvironmentId,
    )
      ? selectedEnvironmentId
      : (environments[0]?.id ?? "");

    if (selectedEnvironmentId !== nextEnvironmentId) {
      setSelectedEnvironmentId(nextEnvironmentId);
    }
  }, [environments, selectedEnvironmentId]);

  const currentOrganization = organizations.find((org) => org.id === selectedOrganizationId);
  const currentProject = projects.find((project) => project.id === selectedProjectId);
  const selectedConfig = configs.find((config) => config.id === selectedConfigId);
  const selectedEnvironment = environments.find(
    (environment) => environment.id === selectedEnvironmentId,
  );
  const isOrganizationAdmin = ["owner", "admin"].includes(currentOrganization?.role ?? "");
  const canManageProjectResources =
    isOrganizationAdmin || currentProject?.currentUserProjectRole === "project_admin";
  const canManageFeatureFlags =
    canManageProjectResources || currentProject?.currentUserProjectRole === "developer";
  const organizationRoleOptions =
    currentOrganization?.role === "owner" ? ownerOrganizationRoles : adminOrganizationRoles;
  const canCreateSdkKey = Boolean(
    selectedProjectId &&
      selectedConfig?.projectId === selectedProjectId &&
      selectedEnvironment?.projectId === selectedProjectId &&
      canManageProjectResources,
  );
  const visibleCreatedSdkKey =
    createdSdkKey &&
    createdSdkKey.projectId === selectedProjectId &&
    createdSdkKey.configId === selectedConfigId &&
    createdSdkKey.environmentId === selectedEnvironmentId
      ? createdSdkKey
      : null;
  const visiblePublicConfigUrl = visibleCreatedSdkKey
    ? `${apiBaseUrl}/public/sdk/${encodeURIComponent(visibleCreatedSdkKey.key)}/config`
    : "";

  function clearCreatedSdkKey() {
    setCreatedSdkKey(null);
    setCopyMessage("");
  }

  const createOrganizationMutation = useCreateOrganization({
    onSuccess: (organization) => {
      setSelectedOrganizationId(organization.id);
      setSelectedProjectId("");
      setSelectedConfigId("");
      setSelectedEnvironmentId("");
      clearCreatedSdkKey();
    },
  });

  const createProjectMutation = useCreateProject({
    organizationId: selectedOrganizationId,
    onSuccess: (project) => {
      setSelectedProjectId(project.id);
      setSelectedConfigId("");
      setSelectedEnvironmentId("");
      clearCreatedSdkKey();
    },
  });

  const createConfigMutation = useCreateConfig({
    projectId: selectedProjectId,
  });

  const createEnvironmentMutation = useCreateEnvironment({
    projectId: selectedProjectId,
  });

  const addOrganizationMemberMutation = useAddOrganizationMember(selectedOrganizationId);
  const addProjectMemberMutation = useAddProjectMember(selectedProjectId);

  const createSdkKeyMutation = useCreateSdkKey({
    projectId: selectedProjectId,
    onSuccess: (sdkKey) => {
      setCreatedSdkKey(
        sdkKey.key
          ? {
              configId: sdkKey.configId,
              environmentId: sdkKey.environmentId,
              key: sdkKey.key,
              projectId: sdkKey.projectId,
            }
          : null,
      );
      setCopyMessage("");
    },
  });

  const {
    formState: { errors: sdkKeyFormErrors, isSubmitting: isSdkKeyFormSubmitting },
    handleSubmit: handleSubmitSdkKey,
    register: registerSdkKey,
    reset: resetSdkKey,
  } = useForm<SdkKeyFormValues>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(sdkKeyFormSchema),
  });

  const logoutMutation = useLogout({
    onSuccess: () => {
      setSelectedOrganizationId("");
      setSelectedProjectId("");
      setSelectedConfigId("");
      setSelectedEnvironmentId("");
      clearCreatedSdkKey();
      navigate("/login");
    },
  });

  async function handleCreateSdkKey(values: SdkKeyFormValues) {
    if (!selectedConfig || !selectedEnvironment) {
      return;
    }

    const name = values.name.trim();

    try {
      await createSdkKeyMutation.mutateAsync({
        configId: selectedConfig.id,
        environmentId: selectedEnvironment.id,
        ...(name ? { name } : {}),
      });
      resetSdkKey();
    } catch {
      // Mutation hooks expose the error state in the page.
    }
  }

  async function handleCopySdkKey() {
    if (!visibleCreatedSdkKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(visibleCreatedSdkKey.key);
      setCopyMessage("Chave copiada.");
    } catch {
      setCopyMessage("Nao foi possivel copiar automaticamente.");
    }
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
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
          type="button"
        >
          Sair
        </button>
      </header>

      <main className="grid gap-4 lg:grid-cols-2">
        <Panel title="Organizacoes">
          <CreateNameForm
            disabled={createOrganizationMutation.isPending}
            onSubmit={createOrganizationMutation.mutateAsync}
            placeholder="Nova organizacao"
          />
          <ErrorMessage error={createOrganizationMutation.error} />
          <select
            className={`${fieldClassName} mt-3 w-full`}
            onChange={(event) => {
              setSelectedOrganizationId(event.target.value);
              setSelectedProjectId("");
              setSelectedConfigId("");
              setSelectedEnvironmentId("");
              clearCreatedSdkKey();
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

        <Panel title="Membros da organizacao">
          <MemberForm
            disabled={!selectedOrganizationId || !isOrganizationAdmin}
            isPending={addOrganizationMemberMutation.isPending}
            onSubmit={addOrganizationMemberMutation.mutateAsync}
            roles={organizationRoleOptions}
          />
          {!isOrganizationAdmin ? (
            <PermissionHint>Somente owner ou admin pode adicionar membros.</PermissionHint>
          ) : null}
          <ErrorMessage error={organizationMembersQuery.error} />
          <ErrorMessage error={addOrganizationMemberMutation.error} />
          <OrganizationMemberList members={organizationMembers} />
        </Panel>

        <Panel title="Projetos">
          <CreateNameForm
            disabled={
              !selectedOrganizationId || !isOrganizationAdmin || createProjectMutation.isPending
            }
            onSubmit={createProjectMutation.mutateAsync}
            placeholder="Novo projeto"
          />
          {!isOrganizationAdmin ? (
            <PermissionHint>Somente owner ou admin pode criar projetos.</PermissionHint>
          ) : null}
          <ErrorMessage error={projectsQuery.error} />
          <ErrorMessage error={createProjectMutation.error} />
          <select
            className={`${fieldClassName} mt-3 w-full`}
            onChange={(event) => {
              setSelectedProjectId(event.target.value);
              setSelectedConfigId("");
              setSelectedEnvironmentId("");
              clearCreatedSdkKey();
            }}
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

        <Panel title="Membros do projeto">
          <MemberForm
            disabled={!selectedProjectId || !isOrganizationAdmin}
            isPending={addProjectMemberMutation.isPending}
            onSubmit={addProjectMemberMutation.mutateAsync}
            roles={projectRoles}
          />
          {!isOrganizationAdmin ? (
            <PermissionHint>Somente owner ou admin pode conceder roles por projeto.</PermissionHint>
          ) : null}
          <ErrorMessage error={projectMembersQuery.error} />
          <ErrorMessage error={addProjectMemberMutation.error} />
          <ProjectMemberList members={projectMembers} />
        </Panel>

        <Panel title="Configs">
          <CreateNameForm
            disabled={
              !selectedProjectId || !canManageProjectResources || createConfigMutation.isPending
            }
            onSubmit={createConfigMutation.mutateAsync}
            placeholder="Nova config"
          />
          {!canManageProjectResources ? (
            <PermissionHint>
              Voce nao tem permissao para criar configs neste projeto.
            </PermissionHint>
          ) : null}
          <ErrorMessage error={configsQuery.error} />
          <ErrorMessage error={createConfigMutation.error} />
          <select
            className={`${fieldClassName} mt-3 w-full`}
            disabled={configs.length === 0}
            onChange={(event) => {
              setSelectedConfigId(event.target.value);
              clearCreatedSdkKey();
            }}
            value={selectedConfigId}
          >
            <option value="">Selecione uma config</option>
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name} ({config.key})
              </option>
            ))}
          </select>
          <ItemList
            empty="Sem configs"
            items={configs.map((config) => `${config.name} (${config.key})`)}
          />
        </Panel>

        <Panel title="Ambientes">
          <CreateNameForm
            disabled={
              !selectedProjectId ||
              !canManageProjectResources ||
              createEnvironmentMutation.isPending
            }
            onSubmit={createEnvironmentMutation.mutateAsync}
            placeholder="production"
          />
          {!canManageProjectResources ? (
            <PermissionHint>
              Voce nao tem permissao para criar ambientes neste projeto.
            </PermissionHint>
          ) : null}
          <ErrorMessage error={environmentsQuery.error} />
          <ErrorMessage error={createEnvironmentMutation.error} />
          <select
            className={`${fieldClassName} mt-3 w-full`}
            disabled={environments.length === 0}
            onChange={(event) => {
              setSelectedEnvironmentId(event.target.value);
              clearCreatedSdkKey();
            }}
            value={selectedEnvironmentId}
          >
            <option value="">Selecione um ambiente</option>
            {environments.map((environment) => (
              <option key={environment.id} value={environment.id}>
                {environment.name} ({environment.key})
              </option>
            ))}
          </select>
          <ItemList
            empty="Sem ambientes"
            items={environments.map((environment) => `${environment.name} (${environment.key})`)}
          />
        </Panel>

        <FeatureFlagsPanel
          canManageFeatureFlags={canManageFeatureFlags}
          configId={selectedConfigId}
          environmentId={selectedEnvironmentId}
          environmentName={selectedEnvironment?.name}
        />

        <Panel title="SDK Keys" wide>
          <form
            className="grid gap-3 lg:grid-cols-[1.4fr_auto]"
            noValidate
            onSubmit={handleSubmitSdkKey(handleCreateSdkKey)}
          >
            <div className="grid gap-2">
              <input
                aria-invalid={sdkKeyFormErrors.name ? true : undefined}
                className={fieldClassName}
                disabled={
                  !canCreateSdkKey || createSdkKeyMutation.isPending || isSdkKeyFormSubmitting
                }
                placeholder="Nome da SDK key"
                {...registerSdkKey("name")}
              />
              {sdkKeyFormErrors.name?.message ? (
                <p className="text-sm font-semibold text-red-700">
                  {sdkKeyFormErrors.name.message}
                </p>
              ) : null}
            </div>
            <button
              className={`${primaryButtonClassName} self-start`}
              disabled={
                !canCreateSdkKey || createSdkKeyMutation.isPending || isSdkKeyFormSubmitting
              }
              type="submit"
            >
              {createSdkKeyMutation.isPending ? "Gerando..." : "Gerar key"}
            </button>
          </form>
          {!canManageProjectResources ? (
            <PermissionHint>
              Voce nao tem permissao para gerar SDK keys neste projeto.
            </PermissionHint>
          ) : null}
          <ErrorMessage error={sdkKeysQuery.error} />
          <ErrorMessage error={createSdkKeyMutation.error} />

          {visibleCreatedSdkKey ? (
            <div className="mt-4 grid gap-3 rounded-2xl bg-slate-900 p-4 text-white">
              <span>Copie agora. A chave completa nao sera exibida novamente.</span>
              <code className="break-all">{visibleCreatedSdkKey.key}</code>
              <span className="text-sm text-white/80">Endpoint publico</span>
              <code className="break-all text-sm text-white/90">{visiblePublicConfigUrl}</code>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  className={secondaryButtonClassName}
                  onClick={handleCopySdkKey}
                  type="button"
                >
                  Copiar
                </button>
                {copyMessage ? <span className="text-sm text-white/80">{copyMessage}</span> : null}
              </div>
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
