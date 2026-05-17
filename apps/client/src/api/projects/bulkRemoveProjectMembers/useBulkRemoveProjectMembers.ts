import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { projectQueryKeys } from "@api/projects/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type BulkRemoveProjectMembersInput,
  bulkRemoveProjectMembers,
} from "./bulkRemoveProjectMembers";

type UseBulkRemoveProjectMembersOptions = {
  onSuccess?: (memberIds: string[]) => void;
  projectId: string;
};

export function useBulkRemoveProjectMembers({
  onSuccess,
  projectId,
}: UseBulkRemoveProjectMembersOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Omit<BulkRemoveProjectMembersInput, "projectId">) =>
      bulkRemoveProjectMembers({ ...values, projectId }),
    onSuccess: (_result, { memberIds }) => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.members(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(memberIds);
    },
  });
}
