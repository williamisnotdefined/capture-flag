import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditLogQueryKeys } from "../../auditLogs/queryKeys";
import { projectQueryKeys } from "../queryKeys";
import { type RemoveProjectMemberInput, removeProjectMember } from "./removeProjectMember";

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Omit<RemoveProjectMemberInput, "projectId">) =>
      removeProjectMember({ ...values, projectId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.members(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
    },
  });
}
