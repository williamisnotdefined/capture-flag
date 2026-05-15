import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditLogQueryKeys } from "../../auditLogs/queryKeys";
import { projectQueryKeys } from "../queryKeys";
import { type AddProjectMemberInput, addProjectMember } from "./addProjectMember";

export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Omit<AddProjectMemberInput, "projectId">) =>
      addProjectMember({ ...values, projectId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.members(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
    },
  });
}
