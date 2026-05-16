import { Plus } from "lucide-react";
import { useState } from "react";
import { useCreateConfig } from "../../api/configs";
import {
  Button,
  CreateNameForm,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ErrorMessage,
  PageLayout,
} from "../../components";
import { useProjectResourcesRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { canManageProjectResources } from "../../permissions";
import { ConfigPreviewPanel } from "./ConfigPreviewPanel";
import { ConfigsPanel } from "./ConfigsPanel";

export function ConfigsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { organizationRole, selectedProject, selectedProjectId } =
    useProjectResourcesRouteContext();
  const canManageProjectResourceActions = canManageProjectResources(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );
  const createConfigMutation = useCreateConfig({ projectId: selectedProjectId });
  const canCreateConfig = Boolean(selectedProjectId && canManageProjectResourceActions);

  async function createConfig(name: string) {
    await createConfigMutation.mutateAsync(name);
    setIsCreateOpen(false);
  }

  return (
    <PageLayout
      actions={
        <Button
          disabled={!canCreateConfig || createConfigMutation.isPending}
          onClick={() => setIsCreateOpen(true)}
          type="button"
        >
          <span>Nova config</span>
          <Plus aria-hidden="true" className="h-4 w-4" />
        </Button>
      }
      contentClassName="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      description="Configs agrupam flags e segmentos que serao consumidos pelo SDK como JSON publico versionado."
      eyebrow="Projeto selecionado"
      title="Configs"
    >
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova config</DialogTitle>
            <DialogDescription>Informe o nome da config consumida pelos SDKs.</DialogDescription>
          </DialogHeader>
          <CreateNameForm
            disabled={!canCreateConfig || createConfigMutation.isPending}
            onSubmit={createConfig}
            placeholder="Nova config"
          />
          <ErrorMessage error={createConfigMutation.error} />
        </DialogContent>
      </Dialog>
      <ConfigsPanel />
      <ConfigPreviewPanel />
    </PageLayout>
  );
}
