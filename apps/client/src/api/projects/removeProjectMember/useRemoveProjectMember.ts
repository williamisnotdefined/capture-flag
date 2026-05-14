import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectQueryKeys } from "../queryKeys";
import { type RemoveProjectMemberInput, removeProjectMember } from "./removeProjectMember";

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Omit<RemoveProjectMemberInput, "projectId">) =>
      removeProjectMember({ ...values, projectId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.members(projectId) });
    },
  });
}
