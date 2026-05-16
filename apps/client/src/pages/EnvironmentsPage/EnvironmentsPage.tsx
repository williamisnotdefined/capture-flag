import { useCreateEnvironment } from "@api/environments";
import { Button } from "@components/Button";
import { CreateNameForm } from "@components/CreateNameForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/Dialog";
import { ErrorMessage } from "@components/ErrorMessage";
import { PageLayout } from "@components/PageLayout";
import { useProjectResourcesRouteContext } from "@routing/useRouteContext";
import { canManageProjectResources } from "@src/permissions";
import { Plus } from "lucide-react";
import { useState } from "react";
import { EnvironmentsPanel } from "./EnvironmentsPanel";

export function EnvironmentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { organizationRole, selectedProject, selectedProjectId } =
    useProjectResourcesRouteContext();
  const canManageProjectResourceActions = canManageProjectResources(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );
  const createEnvironmentMutation = useCreateEnvironment({ projectId: selectedProjectId });
  const canCreateEnvironment = Boolean(selectedProjectId && canManageProjectResourceActions);

  async function createEnvironment(name: string) {
    await createEnvironmentMutation.mutateAsync(name);
    setIsCreateOpen(false);
  }

  return (
    <PageLayout
      actions={
        <Button
          disabled={!canCreateEnvironment || createEnvironmentMutation.isPending}
          onClick={() => setIsCreateOpen(true)}
          type="button"
        >
          <span>Novo environment</span>
          <Plus aria-hidden="true" className="h-4 w-4" />
        </Button>
      }
      description="Ambientes representam os runtimes onde valores de flags, SDK keys e previews sao publicados."
      eyebrow="Projeto selecionado"
      title="Environments"
    >
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo environment</DialogTitle>
            <DialogDescription>
              Informe o nome do ambiente para publicar valores de runtime.
            </DialogDescription>
          </DialogHeader>
          <CreateNameForm
            disabled={!canCreateEnvironment || createEnvironmentMutation.isPending}
            dividedFooter
            onSubmit={createEnvironment}
            placeholder="production"
          />
          <ErrorMessage error={createEnvironmentMutation.error} />
        </DialogContent>
      </Dialog>
      <EnvironmentsPanel />
    </PageLayout>
  );
}
