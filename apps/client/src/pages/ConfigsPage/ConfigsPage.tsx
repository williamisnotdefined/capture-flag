import { useCreateConfig } from "@api/configs";
import { Button } from "@components/Button";
import { CreateConfigForm, type CreateConfigFormSubmitValues } from "@components/CreateConfigForm";
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

  async function createConfig(values: CreateConfigFormSubmitValues) {
    await createConfigMutation.mutateAsync(values);
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
      description="Configs agrupam flags e segmentos que serao consumidos pelo SDK como JSON publico versionado."
      eyebrow="Projeto selecionado"
      title="Configs"
    >
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova config</DialogTitle>
            <DialogDescription>
              Informe nome e descricao da config consumida pelos SDKs.
            </DialogDescription>
          </DialogHeader>
          <CreateConfigForm
            disabled={!canCreateConfig || createConfigMutation.isPending}
            dividedFooter
            onSubmit={createConfig}
          />
          <ErrorMessage error={createConfigMutation.error} />
        </DialogContent>
      </Dialog>
      <ConfigsPanel />
      <ConfigPreviewPanel />
    </PageLayout>
  );
}
