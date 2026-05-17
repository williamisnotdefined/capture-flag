import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { projectQueryKeys } from "@api/projects/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkDeleteProjects } from "./bulkDeleteProjects";

type UseBulkDeleteProjectsOptions = {
  onSuccess?: (projectIds: string[]) => void;
  organizationId: string;
};

export function useBulkDeleteProjects({ onSuccess, organizationId }: UseBulkDeleteProjectsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectIds: string[]) => bulkDeleteProjects({ organizationId, projectIds }),
    onSuccess: (_result, projectIds) => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.list(organizationId) });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(projectIds);
    },
  });
}
