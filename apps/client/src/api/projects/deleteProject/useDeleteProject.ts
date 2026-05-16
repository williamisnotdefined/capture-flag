import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { projectQueryKeys } from "@api/projects/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProject } from "./deleteProject";

type UseDeleteProjectOptions = {
  organizationId: string;
  onSuccess?: () => void;
};

export function useDeleteProject({ organizationId, onSuccess }: UseDeleteProjectOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.list(organizationId) });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.();
    },
  });
}
